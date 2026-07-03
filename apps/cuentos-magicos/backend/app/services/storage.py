import io
import logging
import os
from typing import Union
from pathlib import Path

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Local storage directory
STORAGE_DIR = Path(__file__).parent.parent.parent.parent / "storage"
STORAGE_DIR.mkdir(exist_ok=True)


async def upload_to_storage(
    file_data: Union[bytes, io.BytesIO],
    file_path: str,
    content_type: str = "application/octet-stream",
) -> str:
    """
    Upload a file to local storage and return the URL.
    """
    # Convert BytesIO to bytes if needed
    if isinstance(file_data, io.BytesIO):
        file_bytes = file_data.getvalue()
    else:
        file_bytes = file_data

    # Save to local storage
    full_path = STORAGE_DIR / file_path
    full_path.parent.mkdir(parents=True, exist_ok=True)

    with open(full_path, "wb") as f:
        f.write(file_bytes)

    # Return local URL (served by backend)
    local_url = f"/storage/{file_path}"
    logger.info(f"Saved file to local storage: {local_url}")
    return local_url


async def delete_from_storage(file_path: str) -> None:
    """Delete a file from Local Storage."""
    try:
        full_path = STORAGE_DIR / file_path
        if full_path.exists():
            full_path.unlink()
        logger.info(f"Deleted file from storage: {file_path}")
    except Exception as e:
        logger.error(f"Failed to delete file from storage: {e}")
        raise


async def get_signed_url(file_path: str, expires_in: int = 3600) -> str:
    """
    Generate a URL for private files.
    For local storage, it returns the local endpoint path.
    Authentication must be handled by the FastAPI endpoint serving it.
    """
    return f"/storage/{file_path}"
