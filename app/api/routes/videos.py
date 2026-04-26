import hashlib
import re
from datetime import datetime
from pathlib import Path

import aiofiles
from cachetools import TTLCache
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response, StreamingResponse

from ..dependencies import get_settings, verify_session

router = APIRouter()

_META_CACHE: TTLCache = TTLCache(maxsize=50, ttl=300)
_CHUNK_CACHE: TTLCache = TTLCache(maxsize=25, ttl=60)


def _get_video_dir(settings) -> Path:
    return Path(settings.get_video_save_path()).resolve()


def _validate_filename(filename: str):
    if re.search(r"[\\/]", filename):
        raise HTTPException(status_code=400, detail="Invalid filename")


@router.get("")
async def get_video(
    request: Request,
    filename: str = Query(...),
    subfolder: str | None = None,
    settings=Depends(get_settings),
    _: dict = Depends(verify_session),
):
    video_dir = _get_video_dir(settings)
    cache_key = f"{filename}-{subfolder}"

    if meta := _META_CACHE.get(cache_key):
        if_none_match = request.headers.get("If-None-Match")
        if_modified_since = request.headers.get("If-Modified-Since")
        if if_none_match and if_none_match == meta["etag"]:
            return Response(status_code=304)
        if if_modified_since:
            last_modified = datetime.fromisoformat(meta["last_modified"])
            if datetime.strptime(if_modified_since, "%a, %d %b %Y %H:%M:%S GMT") >= last_modified:
                return Response(status_code=304)

    _validate_filename(filename)
    video_path = (video_dir / subfolder / filename) if subfolder else (video_dir / filename)

    # Path traversal protection
    try:
        video_path.resolve().relative_to(video_dir)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not video_path.is_file():
        raise HTTPException(status_code=404, detail="Video file not found")

    stat = video_path.stat()
    file_size = stat.st_size
    last_modified = datetime.fromtimestamp(stat.st_mtime).isoformat()
    etag = hashlib.md5(f"{file_size}-{last_modified}".encode()).hexdigest()

    _META_CACHE[cache_key] = {"etag": etag, "last_modified": last_modified, "file_size": file_size}

    range_header = request.headers.get("Range")
    if range_header:
        start, end = range_header.replace("bytes=", "").split("-")
        start = int(start)
        end = int(end) if end else file_size - 1
        if start >= file_size or end >= file_size:
            raise HTTPException(status_code=416, detail="Requested range not satisfiable")
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(_send_range(video_path, start, end), status_code=206, headers=headers)

    headers = {
        "Content-Length": str(file_size),
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=300",
        "ETag": etag,
        "Last-Modified": datetime.fromisoformat(last_modified).strftime("%a, %d %b %Y %H:%M:%S GMT"),
    }
    return StreamingResponse(_send_full(video_path), headers=headers)


async def _send_full(path: Path):
    async with aiofiles.open(path, "rb") as f:
        while chunk := await f.read(65536):
            yield chunk


async def _send_range(path: Path, start: int, end: int):
    cache_key = f"{path.name}-{start}-{end}"
    if cached := _CHUNK_CACHE.get(cache_key):
        yield cached
        return
    async with aiofiles.open(path, "rb") as f:
        await f.seek(start)
        chunks = []
        pos = start
        while pos <= end:
            chunk = await f.read(min(65536, end - pos + 1))
            if not chunk:
                break
            chunks.append(chunk)
            pos += len(chunk)
    full = b"".join(chunks)
    if len(full) < 1024 * 1024:
        _CHUNK_CACHE[cache_key] = full
    yield full
