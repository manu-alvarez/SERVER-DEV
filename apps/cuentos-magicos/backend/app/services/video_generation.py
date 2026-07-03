from __future__ import annotations

import asyncio
import logging
import os
import tempfile

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.orm import Story, Chapter
from app.services.storage import upload_to_storage

logger = logging.getLogger(__name__)
settings = get_settings()


async def _retry_with_backoff(func, max_retries: int = 3, base_delay: float = 10.0, operation_name: str = "operation"):
    """Execute an async function with exponential backoff retry logic."""
    for attempt in range(max_retries):
        try:
            return await func()
        except (httpx.ReadTimeout, httpx.ConnectError, httpx.RemoteProtocolError, httpx.HTTPStatusError) as e:
            delay = base_delay * (2 ** attempt)
            logger.warning(f"{operation_name} failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {delay}s...")
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(delay)
        except Exception as e:
            logger.error(f"{operation_name} failed with non-retryable error: {e}")
            raise



async def _download_asset(url: str, suffix: str) -> str | None:
    """Download an asset to a temporary file."""
    if not url: return None
    try:
        if url.startswith("/storage/"):
            from pathlib import Path
            local_path = Path(__file__).parent.parent.parent.parent / "storage" / url.replace("/storage/", "")
            if local_path.exists():
                return str(local_path)
        
        full_url = url
        if not url.startswith("http"):
            full_url = f"http://localhost:{settings.APP_PORT}{url}"
            
        import httpx
        import tempfile
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(full_url, timeout=60.0)
            resp.raise_for_status()
            
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(resp.content)
            return tmp.name
    except Exception as e:
        logger.error(f"Failed to download asset {url}: {e}")
        return None

async def _mux_video_and_audio(video_path: str, audio_path: str, output_path: str) -> bool:
    import subprocess
    try:
        probe_cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", audio_path
        ]
        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
        duration = float(probe_result.stdout.strip())
        
        cmd = [
            "ffmpeg", "-y",
            "-stream_loop", "-1", "-i", video_path,
            "-i", audio_path,
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "28",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            "-t", str(duration),
            output_path
        ]
        logger.info(f"Muxing AI video with audio: {' '.join(cmd)}")
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        if res.returncode != 0:
            logger.error(f"FFmpeg muxing failed: {res.stderr}")
            return False
        return True
    except Exception as e:
        logger.error(f"Failed to mux video and audio: {e}")
        return False


async def generate_video_for_story(session: AsyncSession, story_id: str) -> None:
    """Generate video clips for all chapters, mux with audio, and concat into a final story video."""
    logger.info(f"Generating video for story_id={story_id}")

    result = await session.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        logger.error(f"Story not found: {story_id}")
        return

    story.video_status = "processing"
    await session.commit()

    chapters_result = await session.execute(
        select(Chapter)
        .where(Chapter.story_id == story_id)
        .order_by(Chapter.chapter_number)
    )
    chapters = chapters_result.scalars().all()

    chapter_video_files = []
    import tempfile
    import os

    for chapter in chapters:
        # Wait for image to be ready
        if not chapter.url_image:
            for _ in range(36):
                await asyncio.sleep(5)
                await session.refresh(chapter)
                if chapter.url_image: break

        if not chapter.url_image:
            logger.warning(f"No image for chapter {chapter.chapter_number}")
            chapter.video_status = "skipped"
            await session.commit()
            continue

        chapter.video_status = "processing"
        await session.commit()

        # Wait for audio to be ready
        audio_url = chapter.url_audio
        if not audio_url:
            for _ in range(24):
                await asyncio.sleep(5)
                await session.refresh(chapter)
                if chapter.url_audio:
                    audio_url = chapter.url_audio
                    break

        if not audio_url:
            logger.warning(f"No audio for chapter {chapter.chapter_number}")
            chapter.video_status = "skipped"
            await session.commit()
            continue
            
        # Download Audio
        local_audio_path = await _download_asset(audio_url, ".mp3")
        if not local_audio_path:
            logger.warning(f"Failed to download audio for chapter {chapter.chapter_number}")
            chapter.video_status = "skipped"
            await session.commit()
            continue

        # Check if already has a valid video clip generated
        local_muxed_path = None
        
        try:
            video_url = None
            last_error = None

            # PRIORITY 1: ffmpeg local (already muxed inside generate_local_video_from_image_and_audio)
            logger.info(f"Using ffmpeg for chapter {chapter.chapter_number}")
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_vid:
                tmp_video_path = tmp_vid.name

            local_video = await generate_local_video_from_image_and_audio(
                chapter.url_image,
                audio_url,
                tmp_video_path
            )

            if local_video and os.path.exists(local_video):
                local_muxed_path = local_video
            else:
                # Iterate through providers to get an AI video url
                if settings.HUGGINGFACE_TOKEN:
                    try:
                        async def generate_with_huggingface():
                            return await _generate_video_huggingface(chapter.url_image, chapter.video_prompt or "Gentle motion")
                        video_url = await _retry_with_backoff(generate_with_huggingface, max_retries=2, base_delay=15.0, operation_name=f"HF chapter {chapter.chapter_number}")
                    except Exception as e: last_error = e

                if not video_url and settings.KLING_ACCESS_KEY:
                    try:
                        async def generate_with_kling():
                            job_id = await _submit_kling_job(chapter.url_image, chapter.video_prompt or "Gentle motion")
                            return await _poll_kling_job(job_id) if job_id else None
                        video_url = await _retry_with_backoff(generate_with_kling, max_retries=2, base_delay=10.0, operation_name=f"Kling chapter {chapter.chapter_number}")
                    except Exception as e: last_error = e

                if not video_url and settings.PIKA_API_KEY:
                    try:
                        async def generate_with_pika():
                            return await _generate_video_pika(chapter.url_image, chapter.video_prompt or "Gentle motion")
                        video_url = await _retry_with_backoff(generate_with_pika, max_retries=2, base_delay=10.0, operation_name=f"Pika chapter {chapter.chapter_number}")
                    except Exception as e: last_error = e

                if not video_url and settings.SILICONFLOW_API_KEY:
                    try:
                        async def generate_with_siliconflow():
                            job_id = await _submit_siliconflow_job(chapter.url_image, chapter.video_prompt or "Gentle motion")
                            return await _poll_siliconflow_job(job_id) if job_id else None
                        video_url = await _retry_with_backoff(generate_with_siliconflow, max_retries=2, base_delay=8.0, operation_name=f"SiliconFlow chapter {chapter.chapter_number}")
                    except Exception as e: last_error = e

                if not video_url and settings.LUMA_API_KEY:
                    try:
                        async def generate_with_luma():
                            job_id = await _submit_luma_job(chapter.url_image, chapter.video_prompt or "Gentle motion")
                            return await _poll_luma_job(job_id) if job_id else None
                        video_url = await _retry_with_backoff(generate_with_luma, max_retries=2, base_delay=10.0, operation_name=f"Luma chapter {chapter.chapter_number}")
                    except Exception as e: last_error = e

                if not video_url and settings.RUNWAY_API_KEY:
                    try:
                        async def generate_with_runway():
                            return await _submit_runway_job(chapter.url_image, chapter.video_prompt or "Gentle motion")
                        video_url = await _retry_with_backoff(generate_with_runway, max_retries=2, base_delay=15.0, operation_name=f"Runway chapter {chapter.chapter_number}")
                    except Exception as e: last_error = e

                if video_url:
                    # Download silent video
                    local_ai_video = await _download_asset(video_url, ".mp4")
                    if local_ai_video:
                        # Mux it with audio
                        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_mux:
                            mux_path = tmp_mux.name
                        success = await _mux_video_and_audio(local_ai_video, local_audio_path, mux_path)
                        if success:
                            local_muxed_path = mux_path
                        if not local_ai_video.startswith(str(Path(__file__).parent.parent.parent.parent / "storage")):
                            os.remove(local_ai_video)

            if local_muxed_path:
                chapter_video_files.append(local_muxed_path)
                chapter.video_status = "done"
            else:
                chapter.video_status = "failed"
                logger.error(f"Failed to generate/mux video for chapter {chapter.chapter_number}")

        except Exception as e:
            logger.error(f"Failed to generate video for chapter {chapter.chapter_number}: {e}")
            chapter.video_status = "failed"
            
        finally:
            if local_audio_path and not local_audio_path.startswith(str(Path(__file__).parent.parent.parent.parent / "storage")):
                try: os.remove(local_audio_path)
                except: pass

        await session.commit()

    # Step 4: Concat all chapters
    all_done = all(ch.video_status in ("done", "skipped") for ch in chapters)
    if not chapter_video_files:
        logger.error("No chapter videos generated.")
        story.video_status = "failed"
        story.video_generated = True
        await session.commit()
        return

    try:
        import subprocess
        # Create concat file
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            for vid in chapter_video_files:
                f.write(f"file '{vid}'\n")
            concat_list_path = f.name
            
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            final_story_path = f.name

        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_list_path,
            "-c", "copy",
            final_story_path
        ]
        
        logger.info(f"Concatenating story {story_id}: {' '.join(cmd)}")
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if res.returncode != 0:
            logger.error(f"FFmpeg concat failed: {res.stderr}")
            story.video_status = "failed"
        else:
            with open(final_story_path, "rb") as f:
                video_bytes = f.read()
            
            file_path = f"stories/{story_id}/final_story.mp4"
            storage_url = await upload_to_storage(video_bytes, file_path, "video/mp4")
            
            story.url_video = storage_url
            story.video_status = "done"
            
        os.remove(concat_list_path)
        os.remove(final_story_path)
        
    except Exception as e:
        logger.error(f"Story video concatenation failed: {e}")
        story.video_status = "failed"
    finally:
        for vid in chapter_video_files:
            try: os.remove(vid)
            except: pass
        story.video_generated = True
            
    await session.commit()


async def _submit_luma_job(image_url: str, prompt: str) -> str | None:
    """Submit image-to-video generation job to Luma Dream Machine API."""
    headers = {
        "Authorization": f"Bearer {settings.LUMA_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "prompt": prompt or "Gentle cinematic motion, children's book illustration style",
        "image_url": image_url,
        "duration": 5,
        "aspect_ratio": "16:9",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.lumalabs.ai/dream-machine/v1/generations",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("id")
        except Exception as e:
            logger.error(f"Luma API submission failed: {e}")
            return None


async def _poll_luma_job(job_id: str, max_attempts: int = 60, interval: int = 10) -> str | None:
    """Poll Luma API for video generation completion."""
    headers = {
        "Authorization": f"Bearer {settings.LUMA_API_KEY}",
    }

    url = f"https://api.lumalabs.ai/dream-machine/v1/generations/{job_id}"

    for attempt in range(max_attempts):
        await asyncio.sleep(interval)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, timeout=30.0)
                response.raise_for_status()
                data = response.json()

                status = data.get("state", "").lower()
                if status in ("completed", "finished"):
                    return data.get("assets", {}).get("video", "")
                elif status in ("failed", "error"):
                    logger.error(f"Luma job {job_id} failed: {data.get('reason', 'unknown')}")
                    return None
                # Still processing, continue polling

            except Exception as e:
                logger.error(f"Luma polling error (attempt {attempt + 1}): {e}")

    logger.error(f"Luma job {job_id} timed out after {max_attempts} attempts")
    return None


async def _submit_runway_job(image_url: str, prompt: str) -> str | None:
    """Submit image-to-video generation job to Runway ML API (fallback provider)."""
    headers = {
        "Authorization": f"Bearer {settings.RUNWAY_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "promptText": prompt or "Gentle cinematic motion, children's book illustration style",
        "promptImage": image_url,
        "duration": 5,
        "aspectRatio": "16:9",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.runwayml.com/v1/generations",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            job_id = data.get("id")
            
            if not job_id:
                return None
            
            # Poll Runway job
            return await _poll_runway_job(job_id)
        except Exception as e:
            logger.error(f"Runway API submission failed: {e}")
            return None


async def _poll_runway_job(job_id: str, max_attempts: int = 60, interval: int = 10) -> str | None:
    """Poll Runway API for video generation completion."""
    headers = {
        "Authorization": f"Bearer {settings.RUNWAY_API_KEY}",
    }

    url = f"https://api.runwayml.com/v1/generations/{job_id}"

    for attempt in range(max_attempts):
        await asyncio.sleep(interval)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, timeout=30.0)
                response.raise_for_status()
                data = response.json()

                status = data.get("status", "").lower()
                if status in ("succeeded", "completed"):
                    return data.get("output", [{}])[0].get("url", "")
                elif status in ("failed", "error"):
                    logger.error(f"Runway job {job_id} failed: {data.get('error', 'unknown')}")
                    return None

            except Exception as e:
                logger.error(f"Runway polling error (attempt {attempt + 1}): {e}")

    logger.error(f"Runway job {job_id} timed out after {max_attempts} attempts")
    return None


async def _submit_siliconflow_job(image_url: str, prompt: str) -> str | None:
    """Submit image-to-video job to SiliconFlow API (Wan2.1 model)."""
    headers = {
        "Authorization": f"Bearer {settings.SILICONFLOW_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "Wan-AI/Wan2.1-I2V-14B-720P",
        "prompt": prompt,
        "image_url": image_url,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.siliconflow.cn/v1/video/submit",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            request_id = data.get("data", {}).get("request_id")
            if not request_id:
                logger.error(f"SiliconFlow submit response missing request_id: {data}")
                return None
            return request_id
    except Exception as e:
        logger.error(f"SiliconFlow API submission failed: {e}")
        return None


async def _poll_siliconflow_job(request_id: str, max_attempts: int = 60, interval: int = 8) -> str | None:
    """Poll SiliconFlow API for video generation completion."""
    headers = {
        "Authorization": f"Bearer {settings.SILICONFLOW_API_KEY}",
    }

    url = f"https://api.siliconflow.cn/v1/video/{request_id}"

    for attempt in range(max_attempts):
        await asyncio.sleep(interval)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=30.0)
                response.raise_for_status()
                data = response.json()

                status = data.get("data", {}).get("status", "").lower()
                if status == "succeeded":
                    video_url = data.get("data", {}).get("video_url")
                    if video_url:
                        logger.info(f"SiliconFlow video ready: {video_url}")
                        return video_url
                    # Sometimes video is in output
                    output = data.get("data", {}).get("output", {})
                    if isinstance(output, dict):
                        return output.get("video_url") or output.get("url")
                    return None
                elif status == "failed":
                    logger.error(f"SiliconFlow job {request_id} failed: {data.get('message', 'unknown')}")
                    return None

        except Exception as e:
            logger.error(f"SiliconFlow polling error (attempt {attempt + 1}): {e}")

    logger.error(f"SiliconFlow job {request_id} timed out after {max_attempts} attempts")
    return None


async def _generate_video_huggingface(image_url: str, prompt: str) -> str | None:
    """Generate video using HuggingFace Inference API with Wan model."""
    from huggingface_hub import InferenceClient

    try:
        client = InferenceClient("Wan-AI/Wan2.1-I2V-14B-720P", token=settings.HUGGINGFACE_TOKEN)

        # Use synchronous call - HF client handles this
        import concurrent.futures

        def generate():
            return client.image_to_image(
                image=image_url,
                prompt=prompt,
            )

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(generate)
            result = future.result(timeout=180)

        if result:
            # Result is video bytes - save and return URL
            return result
        return None

    except Exception as e:
        logger.error(f"HuggingFace video generation failed: {e}")
        return None


async def generate_local_video_from_image_and_audio(image_url: str, audio_url: str | None, output_path: str) -> str | None:
    """
    Generate an animated slideshow video from an image and an audio track using ffmpeg.
    Creates a slow Ken Burns zoom/pan effect on the static image.
    The video duration will perfectly match the audio narration duration.
    Falls back to a static presentation if Ken Burns fails.
    """
    try:
        import subprocess
        from pathlib import Path

        # 1. Download image (handle local /storage/ paths)
        image_data = None
        if image_url.startswith("/storage/"):
            local_image_path = Path(__file__).parent.parent.parent.parent / "storage" / image_url.replace("/storage/", "")
            if local_image_path.exists():
                image_data = local_image_path.read_bytes()
                logger.info(f"Loaded image from local storage: {local_image_path}")

        if image_data is None:
            full_image_url = image_url
            if not image_url.startswith("http"):
                full_image_url = f"http://localhost:{settings.APP_PORT}{image_url}"
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(full_image_url, timeout=45.0)
                response.raise_for_status()
                image_data = response.content

        # Save image to temp file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_img:
            tmp_img.write(image_data)
            tmp_img_path = tmp_img.name

        # 2. Download audio if available
        tmp_aud_path = None
        if audio_url:
            try:
                # Handle relative local storage URLs
                full_audio_url = audio_url
                if audio_url.startswith("/storage/"):
                    from pathlib import Path
                    local_storage_path = Path(__file__).parent.parent.parent.parent / "storage" / audio_url.replace("/storage/", "")
                    if local_storage_path.exists():
                        tmp_aud_path = str(local_storage_path)
                
                if not tmp_aud_path:
                    if not audio_url.startswith("http"):
                        full_audio_url = f"http://localhost:{settings.APP_PORT}{audio_url}"
                        
                    async with httpx.AsyncClient(follow_redirects=True) as client:
                        response = await client.get(full_audio_url, timeout=45.0)
                        response.raise_for_status()
                        audio_data = response.content
                    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_aud:
                        tmp_aud.write(audio_data)
                        tmp_aud_path = tmp_aud.name
            except Exception as e:
                logger.warning(f"Failed to download audio track from {audio_url}: {e}. Proceeding without audio.")
                tmp_aud_path = None

        # 3. Determine duration of audio track using ffprobe
        duration = 5.0  # default fallback
        if tmp_aud_path:
            try:
                probe_cmd = [
                    "ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1", tmp_aud_path
                ]
                probe_result = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
                duration = float(probe_result.stdout.strip())
                logger.info(f"Detected audio duration: {duration} seconds")
            except Exception as e:
                logger.warning(f"Could not probe audio duration: {e}. Defaulting to 5 seconds.")
                duration = 5.0

        try:
            total_frames = int(duration * 25)
            
            # Ken Burns effect command:
            if tmp_aud_path:
                cmd = [
                    "ffmpeg", "-y",
                    "-loop", "1", "-i", tmp_img_path,
                    "-i", tmp_aud_path,
                    "-vf", f"scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,zoompan=z='min(zoom+0.001,1.5)':d={total_frames}:s=1280x720:fps=25",
                    "-c:v", "libx264",
                    "-tune", "stillimage",
                    "-preset", "fast",
                    "-crf", "28",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-shortest",
                    "-t", str(duration),
                    output_path
                ]
            else:
                cmd = [
                    "ffmpeg", "-y",
                    "-loop", "1", "-i", tmp_img_path,
                    "-vf", f"scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,zoompan=z='min(zoom+0.001,1.5)':d={total_frames}:s=1280x720:fps=25",
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "28",
                    "-pix_fmt", "yuv420p",
                    "-t", str(duration),
                    output_path
                ]

            logger.info(f"Running ffmpeg slideshow command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)

            if result.returncode != 0:
                logger.warning(f"ffmpeg Ken Burns slideshow failed: {result.stderr}. Trying static slide fallback.")
                
                # Simple static fallback command
                if tmp_aud_path:
                    fallback_cmd = [
                        "ffmpeg", "-y",
                        "-loop", "1", "-r", "1", "-i", tmp_img_path,
                        "-i", tmp_aud_path,
                        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black",
                        "-c:v", "libx264",
                        "-tune", "stillimage",
                        "-preset", "fast",
                        "-crf", "28",
                        "-pix_fmt", "yuv420p",
                        "-c:a", "aac",
                        "-b:a", "128k",
                        "-shortest",
                        "-t", str(duration),
                        output_path
                    ]
                else:
                    fallback_cmd = [
                        "ffmpeg", "-y",
                        "-loop", "1", "-r", "1", "-i", tmp_img_path,
                        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black",
                        "-c:v", "libx264",
                        "-preset", "fast",
                        "-crf", "28",
                        "-pix_fmt", "yuv420p",
                        "-t", str(duration),
                        output_path
                    ]
                
                logger.info(f"Running ffmpeg static fallback command: {' '.join(fallback_cmd)}")
                fallback_result = subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=120)
                
                if fallback_result.returncode != 0:
                    logger.error(f"ffmpeg static slideshow fallback failed: {fallback_result.stderr}")
                    return None

            logger.info(f"Generated local slideshow video at {output_path}")
            return output_path

        finally:
            # Clean up temp image
            if os.path.exists(tmp_img_path):
                os.remove(tmp_img_path)
            # Clean up temp audio if created
            if tmp_aud_path and tmp_aud_path != audio_url and not audio_url.startswith("/storage/"):
                if os.path.exists(tmp_aud_path):
                    os.remove(tmp_aud_path)

    except Exception as e:
        logger.error(f"Local video generation failed: {e}")
        return None


async def _submit_kling_job(image_url: str, prompt: str) -> str | None:
    """Submit image-to-video job to Kling AI API (66 credits/day free tier)."""
    headers = {
        "Authorization": f"Bearer {settings.KLING_ACCESS_KEY}",
        "x-api-secret": settings.KLING_SECRET_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "image_url": image_url,
        "prompt": prompt,
        "mode": "std",  # standard mode
        "duration": 5,  # 5 seconds
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.klingai.com/v1/images/generations",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            task_id = data.get("data", {}).get("task_id")
            if not task_id:
                logger.error(f"Kling submit response missing task_id: {data}")
                return None
            return task_id
    except Exception as e:
        logger.error(f"Kling API submission failed: {e}")
        return None


async def _poll_kling_job(task_id: str, max_attempts: int = 60, interval: int = 10) -> str | None:
    """Poll Kling AI API for video generation completion."""
    headers = {
        "Authorization": f"Bearer {settings.KLING_ACCESS_KEY}",
        "x-api-secret": settings.KLING_SECRET_KEY,
    }

    url = f"https://api.klingai.com/v1/images/generations/{task_id}"

    for attempt in range(max_attempts):
        await asyncio.sleep(interval)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=30.0)
                response.raise_for_status()
                data = response.json()

                status = data.get("data", {}).get("task_status", "").lower()
                if status == "completed":
                    video_url = data.get("data", {}).get("video_url")
                    if video_url:
                        logger.info(f"Kling video ready: {video_url}")
                        return video_url
                    # Alternative field
                    videos = data.get("data", {}).get("videos", [])
                    if videos:
                        return videos[0].get("url")
                elif status == "failed":
                    logger.error(f"Kling task {task_id} failed")
                    return None

        except Exception as e:
            logger.error(f"Kling polling error (attempt {attempt + 1}): {e}")

    logger.error(f"Kling task {task_id} timed out after {max_attempts} attempts")
    return None


async def _generate_video_pika(image_url: str, prompt: str) -> str | None:
    """Generate video using Pika Labs API (200 initial credits)."""
    headers = {
        "Authorization": f"Bearer {settings.PIKA_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "image_url": image_url,
        "prompt": prompt,
        "duration": 5,
        "model": "pika-2.0-flash",  # Use the fast model
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.pika.art/v1/generations",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

            # Pika returns video directly or a job to poll
            video_url = data.get("video_url") or data.get("output", {}).get("video_url")
            if video_url:
                return video_url

            # If there's a task_id, poll for completion
            task_id = data.get("task_id") or data.get("id")
            if task_id:
                return await _poll_pika_job(task_id)

            logger.error(f"Pika response missing video_url: {data}")
            return None

    except Exception as e:
        logger.error(f"Pika API generation failed: {e}")
        return None


async def _poll_pika_job(task_id: str, max_attempts: int = 60, interval: int = 8) -> str | None:
    """Poll Pika Labs API for video generation completion."""
    headers = {
        "Authorization": f"Bearer {settings.PIKA_API_KEY}",
    }

    url = f"https://api.pika.art/v1/generations/{task_id}"

    for attempt in range(max_attempts):
        await asyncio.sleep(interval)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=30.0)
                response.raise_for_status()
                data = response.json()

                status = data.get("status", "").lower()
                if status in ("completed", "succeeded"):
                    video_url = data.get("video_url") or data.get("output", {}).get("video_url")
                    if video_url:
                        return video_url
                elif status in ("failed", "error"):
                    logger.error(f"Pika task {task_id} failed")
                    return None

        except Exception as e:
            logger.error(f"Pika polling error (attempt {attempt + 1}): {e}")

    logger.error(f"Pika task {task_id} timed out after {max_attempts} attempts")
    return None
