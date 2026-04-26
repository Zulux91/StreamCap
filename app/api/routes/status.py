from fastapi import APIRouter, Depends

from ..dependencies import get_recording_manager, get_settings, verify_session

router = APIRouter()


@router.get("/health")
async def health(settings=Depends(get_settings)):
    version = "unknown"
    try:
        import json
        import os
        path = os.path.join(settings.app.run_path, "config", "version.json")
        with open(path) as f:
            data = json.load(f)
        version = data["version_updates"][0]["version"]
    except Exception:
        pass
    return {"status": "ok", "version": version}


@router.get("/status")
async def app_status(
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    recordings = rm.recordings
    return {
        "active_recordings": sum(1 for r in recordings if r.is_recording),
        "live_streams": sum(1 for r in recordings if r.is_live),
        "monitoring": sum(1 for r in recordings if r.monitor_status),
        "recording_enabled": rm.app.recording_enabled,
    }


@router.get("/updates/check")
async def check_updates(
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    try:
        info = await rm.app.update_checker.check_for_updates()
        return info
    except Exception as exc:
        return {"has_update": False, "error": str(exc)}
