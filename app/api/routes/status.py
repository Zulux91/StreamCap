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
    if not rm.periodic_task or rm.periodic_task.done():
        await rm.setup_periodic_live_check(int(rm.loop_time_seconds or 180))

    recordings = rm.recordings
    return {
        "active_recordings": sum(1 for r in recordings if r.is_recording),
        "live_streams": sum(1 for r in recordings if r.is_live),
        "monitoring": sum(1 for r in recordings if r.monitor_status),
        "recording_enabled": rm.app.recording_enabled,
        "live_checker": rm.get_periodic_live_check_status(),
    }


@router.post("/live-checker/restart")
async def restart_live_checker(
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    return await rm.restart_periodic_live_check(int(rm.loop_time_seconds or 180))


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
