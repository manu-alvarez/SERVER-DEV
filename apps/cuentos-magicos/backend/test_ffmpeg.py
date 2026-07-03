import asyncio
import os
import subprocess
from app.services.video_generation import generate_local_video_from_image_and_audio

async def test():
    # Use a public sample image and audio
    image_url = "https://picsum.photos/800/800"
    # A short public mp3 file for testing
    audio_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    
    output_path = "test_slideshow.mp4"
    if os.path.exists(output_path):
        os.remove(output_path)
        
    print("Generating local video from image and audio using ffmpeg...")
    result_path = await generate_local_video_from_image_and_audio(image_url, audio_url, output_path)
    
    if result_path and os.path.exists(result_path):
        print(f"Success! Video generated at {result_path}")
        # Probe the generated video
        probe_cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", result_path
        ]
        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
        print(f"Generated video duration: {probe_result.stdout.strip()} seconds")
    else:
        print("Failed to generate video.")

asyncio.run(test())
