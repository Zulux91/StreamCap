import asyncio
import shutil
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from streamget import StreamData

from app.api import dependencies
from app.api.app import app as api_app
from app.api.routes.events import events_stream
from app.api.server import _HeadlessApp, _HeadlessPage
from app.core.events.event_bus import EventBus, RecordingEvent
from app.core.recording.record_manager import GlobalRecordingState, RecordingManager
from app.core.recording.stream_manager import LiveStreamRecorder
from app.models.recording.recording_model import Recording
from app.models.recording.recording_status_model import RecordingStatus


class HeadlessApiSmokeTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.run_path = Path(self.tmp.name)
        repo_root = Path(__file__).resolve().parents[1]
        shutil.copytree(repo_root / "config", self.run_path / "config")
        shutil.copytree(repo_root / "locales", self.run_path / "locales")

        from app.api import server

        self.original_execute_dir = server.execute_dir
        server.execute_dir = str(self.run_path)
        EventBus._instance = None
        GlobalRecordingState.recordings = []
        RecordingManager.set_periodic_task_running(False)

        self.headless_app = _HeadlessApp(_HeadlessPage())
        self.auth_manager = __import__("app.auth.auth_manager", fromlist=["AuthManager"]).AuthManager(self.headless_app)
        self.headless_app.auth_manager = self.auth_manager
        await self.auth_manager.initialize()

        dependencies._recording_manager = self.headless_app.record_manager
        dependencies._auth_manager = self.auth_manager
        dependencies._settings = self.headless_app.settings
        dependencies._flet_loop = asyncio.get_running_loop()

        self.client = TestClient(api_app)

    async def asyncTearDown(self):
        from app.api import server

        server.execute_dir = self.original_execute_dir
        dependencies._recording_manager = None
        dependencies._auth_manager = None
        dependencies._settings = None
        dependencies._flet_loop = None
        EventBus._instance = None
        GlobalRecordingState.recordings = []
        RecordingManager.set_periodic_task_running(False)
        self.tmp.cleanup()

    def _auth_headers(self):
        response = self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin"},
        )
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['token']}"}

    def _auth_token_and_headers(self):
        response = self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin"},
        )
        assert response.status_code == 200, response.text
        token = response.json()["token"]
        return token, {"Authorization": f"Bearer {token}"}

    def _create_recording(self, headers: dict[str, str], **overrides):
        payload = {
            "url": "https://example.com/live/test",
            "streamer_name": "smoke-test",
            "quality": "OD",
            "record_format": "TS",
            "segment_record": False,
            "segment_time": 3600,
            "monitor_status": False,
            "scheduled_recording": False,
            "scheduled_start_time": "",
            "monitor_hours": "",
            "recording_dir": "",
            "enabled_message_push": False,
            "only_notify_no_record": False,
            "flv_use_direct_download": False,
        }
        payload.update(overrides)
        response = self.client.post("/api/recordings", headers=headers, json=payload)
        assert response.status_code == 201, response.text
        return response.json()

    def test_core_api_workflow_runs_headless(self):
        headers = self._auth_headers()

        response = self.client.get("/api/health")
        assert response.status_code == 200, response.text

        rec_id = self._create_recording(headers)["rec_id"]

        response = self.client.get("/api/recordings", headers=headers)
        assert response.status_code == 200, response.text
        assert len(response.json()) == 1

        response = self.client.delete(f"/api/recordings/{rec_id}", headers=headers)
        assert response.status_code == 204, response.text

    def test_recordings_contract_includes_all_frontend_fields_and_statuses(self):
        headers = self._auth_headers()
        self._create_recording(headers)
        recording = self.headless_app.record_manager.recordings[0]
        recording.status_info = RecordingStatus.LIVE_STATUS_CHECK_ERROR

        response = self.client.get("/api/recordings", headers=headers)
        assert response.status_code == 200, response.text
        body = response.json()
        assert isinstance(body, list)
        assert body[0]["status_info"] == "LIVE_STATUS_CHECK_ERROR"

        expected_keys = {
            "rec_id",
            "url",
            "streamer_name",
            "quality",
            "record_format",
            "segment_record",
            "segment_time",
            "monitor_status",
            "scheduled_recording",
            "scheduled_start_time",
            "monitor_hours",
            "recording_dir",
            "enabled_message_push",
            "only_notify_no_record",
            "flv_use_direct_download",
            "platform",
            "platform_key",
            "is_live",
            "is_recording",
            "is_checking",
            "status_info",
            "display_title",
            "speed",
            "cumulative_duration_seconds",
        }
        assert expected_keys.issubset(body[0].keys())

    def test_storage_contract_matches_frontend_shapes(self):
        headers = self._auth_headers()
        downloads = self.run_path / "downloads"
        nested = downloads / "TikTok" / "heysoymaria"
        nested.mkdir(parents=True)
        video = nested / "sample.mp4"
        video.write_bytes(b"video")

        response = self.client.get("/api/storage/stats", headers=headers)
        assert response.status_code == 200, response.text
        stats = response.json()
        assert set(stats.keys()) == {"total", "used", "free", "path"}
        assert isinstance(stats["total"], int)
        assert isinstance(stats["used"], int)
        assert isinstance(stats["free"], int)

        response = self.client.get("/api/storage/browse", headers=headers)
        assert response.status_code == 200, response.text
        root_entries = response.json()
        assert isinstance(root_entries, list)
        assert root_entries[0]["name"] == "TikTok"
        assert root_entries[0]["type"] == "directory"

        response = self.client.get("/api/storage/browse", headers=headers, params={"path": "TikTok/heysoymaria"})
        assert response.status_code == 200, response.text
        file_entries = response.json()
        assert file_entries[0]["name"] == "sample.mp4"
        assert file_entries[0]["type"] == "file"
        assert file_entries[0]["size"] == 5

    def test_video_endpoint_accepts_session_cookie(self):
        token, _headers = self._auth_token_and_headers()
        downloads = self.run_path / "downloads"
        nested = downloads / "TikTok" / "heysoymaria"
        nested.mkdir(parents=True)
        video = nested / "sample.mp4"
        video.write_bytes(b"video")
        self.client.cookies.set("streamcap-token", token)

        response = self.client.get(
            "/api/videos",
            params={"filename": "sample.mp4", "subfolder": "TikTok/heysoymaria"},
        )

        assert response.status_code == 200, response.text
        assert response.content == b"video"

    def test_browser_exported_cookie_array_can_be_saved(self):
        headers = self._auth_headers()

        response = self.client.put(
            "/api/settings/cookies",
            headers=headers,
            json=[
                {"name": "sessionid", "value": "abc123", "domain": ".tiktok.com"},
                {"name": "msToken", "value": "token456", "domain": ".tiktok.com"},
            ],
        )

        assert response.status_code == 200, response.text
        assert response.json()["tiktok"] == "sessionid=abc123; msToken=token456"

    async def test_sse_accepts_valid_session_token_and_includes_rec_id(self):
        token, _headers = self._auth_token_and_headers()

        class ConnectedRequest:
            async def is_disconnected(self):
                return False

        response = await events_stream(ConnectedRequest(), token=token)
        iterator = response.body_iterator
        next_event = asyncio.create_task(iterator.__anext__())
        await asyncio.sleep(0.05)
        EventBus.get_instance().publish(
            RecordingEvent("recording_updated", "rec-123", {"status_info": "MONITORING"})
        )
        event_chunk = await asyncio.wait_for(next_event, timeout=1.0)
        await iterator.aclose()

        assert event_chunk["event"] == "recording_updated"
        assert '"rec_id": "rec-123"' in event_chunk["data"]

    async def test_generated_recording_paths_are_ascii_safe(self):
        self.headless_app.page.run_task = lambda *_args, **_kwargs: None
        recording = Recording(
            rec_id="smoke",
            url="https://example.com/live/test",
            streamer_name="heysoymaria",
            record_format="TS",
            quality="OD",
            segment_record=False,
            segment_time=3600,
            monitor_status=True,
            scheduled_recording=False,
            scheduled_start_time="",
            monitor_hours="",
            recording_dir="",
            enabled_message_push=False,
            only_notify_no_record=False,
            flv_use_direct_download=False,
        )
        recorder = LiveStreamRecorder(
            self.headless_app,
            recording,
            {"output_dir": str(self.run_path / "downloads")},
        )
        stream_info = StreamData(platform="TikTok直播", anchor_name="heysoymaria", title="ASMR ✨")
        output_dir = recorder._get_output_dir(stream_info)

        assert "TikTok" in output_dir
        assert "直播" not in output_dir
        assert all(ord(char) < 128 for char in Path(output_dir).name)

    def test_live_stream_recorder_can_initialize_headless(self):
        recording = Recording(
            rec_id="smoke",
            url="https://example.com/live/test",
            streamer_name="smoke-test",
            record_format="TS",
            quality="OD",
            segment_record=False,
            segment_time=3600,
            monitor_status=True,
            scheduled_recording=False,
            scheduled_start_time="",
            monitor_hours="",
            recording_dir="",
            enabled_message_push=False,
            only_notify_no_record=False,
            flv_use_direct_download=False,
        )
        recorder = LiveStreamRecorder(
            self.headless_app,
            recording,
            {"output_dir": str(self.run_path / "downloads")},
        )
        assert recorder.app is self.headless_app


if __name__ == "__main__":
    unittest.main()
