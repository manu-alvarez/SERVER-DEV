"""
Cleanup script for legacy stuck stories.

Deletes test stories (text_pending, no chapters) and retries
stories that have failed chapters.

Usage:
    source venv/bin/activate && python scripts/cleanup_stuck.py
"""
import asyncio
import logging

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from app.core.config import get_settings
from app.models.orm import Story, Chapter

logger = logging.getLogger(__name__)
settings = get_settings()


async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:
        print("=" * 60)
        print("Cleaning up stuck stories...")
        print("=" * 60)

        # 1. Delete test stories (text_pending, no chapters)
        result = await session.execute(
            select(Story).where(Story.status == "text_pending")
        )
        test_stories = result.scalars().all()
        for s in test_stories:
            ch = await session.execute(
                select(Chapter).where(Chapter.story_id == s.id)
            )
            chapters = ch.scalars().all()
            if not chapters:
                print(f"  Deleting test story: {s.id} | {s.child_name} | {s.created_at}")
                await session.execute(delete(Chapter).where(Chapter.story_id == s.id))
                await session.delete(s)

        await session.commit()
        print()

        # 2. Reset and retry stuck stories (text_ready with failed chapters)
        result = await session.execute(
            select(Story).where(Story.status.in_(["text_ready", "processing"]))
        )
        stuck = result.scalars().all()
        for s in stuck:
            print(f"  Story: {s.id} | {s.status} | {s.title}")

            ch_result = await session.execute(
                select(Chapter).where(Chapter.story_id == s.id).order_by(Chapter.chapter_number)
            )
            chapters = ch_result.scalars().all()

            for ch in chapters:
                if ch.image_status == "failed":
                    print(f"    Resetting Ch {ch.chapter_number}: image_status failed -> pending")
                    ch.image_status = "pending"

            s.images_generated = all(ch.image_status == "done" for ch in chapters)
            s.audio_generated = all(ch.audio_status == "done" for ch in chapters)

            if s.text_generated and (not s.images_generated or not s.audio_generated):
                s.status = "text_ready"

            await session.commit()

        await engine.dispose()

    print()
    print("Done! Now run the following to retry via Celery:")
    print()
    print("  # Retry all stuck stories:")
    for s in stuck:
        print(f'  curl -X POST "http://localhost:8000/api/stories/{s.id}/retry"')
    print()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
