from typing import Optional

from pydantic import BaseModel


class RecordingResponse(BaseModel):
    rec_id: str
    url: str
    streamer_name: str
    quality: str
    record_format: str
    segment_record: bool
    segment_time: int
    monitor_status: bool
    scheduled_recording: bool
    scheduled_start_time: str
    monitor_hours: str
    recording_dir: str
    enabled_message_push: bool
    only_notify_no_record: bool
    flv_use_direct_download: bool
    platform: Optional[str] = None
    platform_key: Optional[str] = None
    is_live: bool = False
    is_recording: bool = False
    is_checking: bool = False
    status_info: Optional[str] = None
    display_title: str = ""
    speed: str = "0 KB/s"
    cumulative_duration_seconds: float = 0.0


class CreateRecordingInput(BaseModel):
    url: str
    streamer_name: str
    quality: str = "OD"
    record_format: str = "TS"
    segment_record: bool = False
    segment_time: int = 1800
    monitor_status: bool = True
    scheduled_recording: bool = False
    scheduled_start_time: str = ""
    monitor_hours: str = ""
    recording_dir: str = ""
    enabled_message_push: bool = False
    only_notify_no_record: bool = False
    flv_use_direct_download: bool = False


class UpdateRecordingInput(BaseModel):
    url: Optional[str] = None
    streamer_name: Optional[str] = None
    quality: Optional[str] = None
    record_format: Optional[str] = None
    segment_record: Optional[bool] = None
    segment_time: Optional[int] = None
    scheduled_recording: Optional[bool] = None
    scheduled_start_time: Optional[str] = None
    monitor_hours: Optional[str] = None
    recording_dir: Optional[str] = None
    enabled_message_push: Optional[bool] = None
    only_notify_no_record: Optional[bool] = None
    flv_use_direct_download: Optional[bool] = None


class BatchIdsInput(BaseModel):
    ids: list[str] = []
