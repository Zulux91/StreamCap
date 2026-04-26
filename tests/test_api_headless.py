import asyncio
import shutil
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.api import dependencies
from app.api.app import app as api_app
from app.api.server import _HeadlessApp, _HeadlessPage
from app.core.recording.record_manager import GlobalRecordingState, RecordingManager
from app.core.recording.stream_manager import LiveStreamRecorder
from app.models.recording.recording_model import Recording


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
        GlobalRecordingState.recordings = []
        RecordingManager.set_periodic_task_running(False)
        self.tmp.cleanup()

    def _auth_headers(self):
        response = self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin"},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return {"Authorization": f"Bearer {response.json()['token']}"}

    def test_core_api_workflow_runs_headless(self):
        headers = self._auth_headers()

        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200, response.text)

        response = self.client.post(
            "/api/recordings",
            headers=headers,
            json={
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
            },
        )
        self.assertEqual(response.status_code, 201, response.text)
        rec_id = response.json()["rec_id"]

        response = self.client.get("/api/recordings", headers=headers)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(len(response.json()), 1)

        response = self.client.delete(f"/api/recordings/{rec_id}", headers=headers)
        self.assertEqual(response.status_code, 204, response.text)

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

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["tiktok"], "sessionid=abc123; msToken=token456")

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
        self.assertIs(recorder.app, self.headless_app)


if __name__ == "__main__":
    unittest.main()
