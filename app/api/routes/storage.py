import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from ..dependencies import get_settings, verify_session

router = APIRouter()
VIDEO_EXTENSIONS = {".mp4", ".ts", ".flv", ".mkv", ".mov", ".nut"}


def _get_video_dir(settings) -> Path:
    return Path(settings.get_video_save_path()).resolve()


def _validate_path(video_dir: Path, relative: str) -> Path:
    """Resolve and validate that path stays within video_dir."""
    try:
        resolved = (video_dir / relative).resolve()
        resolved.relative_to(video_dir)
        return resolved
    except ValueError:
        raise HTTPException(status_code=400, detail="Path outside allowed directory")


def _get_video_stats(video_dir: Path) -> tuple[int, int]:
    count = 0
    size = 0
    for item in video_dir.rglob("*"):
        if not item.is_file() or item.suffix.lower() not in VIDEO_EXTENSIONS:
            continue
        count += 1
        size += item.stat().st_size
    return count, size


@router.get("/browse")
async def browse(
    path: str = Query(""),
    settings=Depends(get_settings),
    _: dict = Depends(verify_session),
):
    video_dir = _get_video_dir(settings)
    target = _validate_path(video_dir, path) if path else video_dir

    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    if target.is_file():
        raise HTTPException(status_code=400, detail="Path is a file")

    entries = []
    for item in sorted(target.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
        stat = item.stat()
        rel = str(item.relative_to(video_dir)).replace("\\", "/")
        entries.append({
            "name": item.name,
            "type": "directory" if item.is_dir() else "file",
            "size": stat.st_size if item.is_file() else 0,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "path": rel,
        })
    return entries


@router.get("/stats")
async def storage_stats(
    settings=Depends(get_settings),
    _: dict = Depends(verify_session),
):
    video_dir = _get_video_dir(settings)
    try:
        total, _disk_used, free = shutil.disk_usage(str(video_dir))
        video_count, videos_used = _get_video_stats(video_dir)
        return {
            "total": total,
            "used": videos_used,
            "free": free,
            "path": str(video_dir),
            "video_count": video_count,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/delete")
async def delete_file(
    body: dict[str, Any],
    settings=Depends(get_settings),
    _: dict = Depends(verify_session),
):
    rel_path = body.get("path", "")
    if not rel_path:
        raise HTTPException(status_code=400, detail="path required")

    video_dir = _get_video_dir(settings)
    target = _validate_path(video_dir, rel_path)

    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")
    if target.is_dir():
        raise HTTPException(status_code=400, detail="Use path to a file, not directory")

    target.unlink()
    return {"success": True, "deleted": rel_path}
