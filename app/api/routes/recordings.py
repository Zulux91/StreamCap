import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from ...models.recording.recording_model import Recording
from ..dependencies import get_recording_manager, run_in_flet_loop, verify_session
from ..schemas.recording import (
    BatchIdsInput,
    CreateRecordingInput,
    RecordingResponse,
    UpdateRecordingInput,
)

router = APIRouter()


def _to_response(recording: Recording) -> RecordingResponse:
    duration_seconds = recording.cumulative_duration.total_seconds() if recording.cumulative_duration else 0.0
    if recording.is_recording and recording.start_time:
        elapsed = (datetime.now() - recording.start_time).total_seconds()
        duration_seconds += elapsed
    return RecordingResponse(
        rec_id=recording.rec_id,
        url=recording.url or "",
        streamer_name=recording.streamer_name or "",
        quality=recording.quality or "OD",
        record_format=recording.record_format or "TS",
        segment_record=bool(recording.segment_record),
        segment_time=int(recording.segment_time or 1800),
        monitor_status=bool(recording.monitor_status),
        scheduled_recording=bool(recording.scheduled_recording),
        scheduled_start_time=recording.scheduled_start_time or "",
        monitor_hours=str(recording.monitor_hours or ""),
        recording_dir=recording.recording_dir or "",
        enabled_message_push=bool(recording.enabled_message_push),
        only_notify_no_record=bool(recording.only_notify_no_record),
        flv_use_direct_download=bool(recording.flv_use_direct_download),
        platform=recording.platform,
        platform_key=recording.platform_key,
        is_live=bool(recording.is_live),
        is_recording=bool(recording.is_recording),
        is_checking=bool(recording.is_checking),
        status_info=recording.status_info,
        display_title=recording.display_title or recording.title or "",
        speed=recording.speed or "0 KB/s",
        cumulative_duration_seconds=duration_seconds,
    )


def _get_or_404(rm, rec_id: str) -> Recording:
    recording = rm.find_recording_by_id(rec_id)
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    return recording


@router.get("", response_model=list[RecordingResponse])
async def list_recordings(
    status: Optional[str] = None,
    platform: Optional[str] = None,
    search: Optional[str] = None,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    recordings = list(rm.recordings)
    if status:
        recordings = [r for r in recordings if r.status_info == status]
    if platform:
        recordings = [r for r in recordings if r.platform_key == platform]
    if search:
        q = search.lower()
        recordings = [
            r for r in recordings
            if q in (r.streamer_name or "").lower() or q in (r.url or "").lower()
        ]
    return [_to_response(r) for r in recordings]


@router.get("/{rec_id}", response_model=RecordingResponse)
async def get_recording(
    rec_id: str,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    return _to_response(_get_or_404(rm, rec_id))


@router.post("", response_model=RecordingResponse, status_code=201)
async def create_recording(
    body: CreateRecordingInput,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    recording = Recording(
        rec_id=str(uuid.uuid4()),
        url=body.url,
        streamer_name=body.streamer_name,
        record_format=body.record_format,
        quality=body.quality,
        segment_record=body.segment_record,
        segment_time=body.segment_time,
        monitor_status=False,
        scheduled_recording=body.scheduled_recording,
        scheduled_start_time=body.scheduled_start_time,
        monitor_hours=body.monitor_hours,
        recording_dir=body.recording_dir,
        enabled_message_push=body.enabled_message_push,
        only_notify_no_record=body.only_notify_no_record,
        flv_use_direct_download=body.flv_use_direct_download,
    )
    await run_in_flet_loop(rm.add_recording(recording))
    if body.monitor_status:
        await run_in_flet_loop(rm.start_monitor_recording(recording))
    return _to_response(recording)


@router.put("/{rec_id}", response_model=RecordingResponse)
async def update_recording(
    rec_id: str,
    body: UpdateRecordingInput,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    recording = _get_or_404(rm, rec_id)
    updates = body.model_dump(exclude_none=True)
    if updates:
        recording.update(updates)
        await run_in_flet_loop(rm.persist_recordings())
    return _to_response(recording)


@router.delete("/{rec_id}", status_code=204)
async def delete_recording(
    rec_id: str,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    recording = _get_or_404(rm, rec_id)
    if recording.is_recording:
        raise HTTPException(status_code=409, detail="Recording is active — stop it first")
    await run_in_flet_loop(rm.delete_recording_cards([recording]))


@router.post("/batch/delete")
async def batch_delete(
    body: BatchIdsInput,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    recordings = [rm.find_recording_by_id(rid) for rid in body.ids]
    recordings = [r for r in recordings if r is not None]
    active = [r for r in recordings if r.is_recording]
    if active:
        raise HTTPException(
            status_code=409,
            detail=f"{len(active)} recording(s) still active — stop them first",
        )
    await run_in_flet_loop(rm.delete_recording_cards(recordings))
    return {"deleted": len(recordings)}


@router.post("/batch/start")
async def batch_start(
    body: BatchIdsInput,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    if body.ids:
        recordings = [rm.find_recording_by_id(rid) for rid in body.ids]
        recordings = [r for r in recordings if r is not None]
    else:
        recordings = list(rm.recordings)

    for recording in recordings:
        await run_in_flet_loop(rm.start_monitor_recording(recording, auto_save=False))
    await run_in_flet_loop(rm.persist_recordings())
    return {"started": len(recordings)}


@router.post("/batch/stop")
async def batch_stop(
    body: BatchIdsInput,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    if body.ids:
        recordings = [rm.find_recording_by_id(rid) for rid in body.ids]
        recordings = [r for r in recordings if r is not None]
    else:
        recordings = list(rm.recordings)

    for recording in recordings:
        await run_in_flet_loop(rm.stop_monitor_recording(recording, auto_save=False))
    await run_in_flet_loop(rm.persist_recordings())
    return {"stopped": len(recordings)}


@router.post("/{rec_id}/start")
async def start_monitoring(
    rec_id: str,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    recording = _get_or_404(rm, rec_id)
    await run_in_flet_loop(rm.start_monitor_recording(recording))
    return {"success": True}


@router.post("/{rec_id}/stop")
async def stop_monitoring(
    rec_id: str,
    rm=Depends(get_recording_manager),
    _: dict = Depends(verify_session),
):
    recording = _get_or_404(rm, rec_id)
    await run_in_flet_loop(rm.stop_monitor_recording(recording))
    return {"success": True}
