import asyncio
from sqlalchemy import text
from app.core.db import engine

async def add_columns():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE stories ADD COLUMN url_video VARCHAR;"))
            print("Added url_video")
        except Exception as e:
            print(e)
        try:
            await conn.execute(text("ALTER TABLE stories ADD COLUMN video_status VARCHAR DEFAULT 'pending' NOT NULL;"))
            print("Added video_status")
        except Exception as e:
            print(e)

if __name__ == "__main__":
    asyncio.run(add_columns())
