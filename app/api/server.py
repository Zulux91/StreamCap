import asyncio
import os
from types import SimpleNamespace
from typing import Any

import uvicorn

from app import execute_dir
from app.auth.auth_manager import AuthManager
from app.core.config.config_manager import ConfigManager
from app.core.config.language_manager import LanguageManager
from app.core.recording.record_manager import RecordingManager
from app.core.runtime.process_manager import AsyncProcessManager
from app.core.update.update_checker import UpdateChecker
from app.utils import utils

from . import dependencies
from .app import app as api_app


class _PubSub:
    def subscribe_topic(self, *_args: Any, **_kwargs: Any) -> None:
        return None

    def unsubscribe_topic(self, *_args: Any, **_kwargs: Any) -> None:
        return None

    def send_others_on_topic(self, *_args: Any, **_kwargs: Any) -> None:
        return None

    def unsubscribe_all(self) -> None:
        return None


class _HeadlessPage:
    """Minimal Flet page substitute for API-only Docker deployments."""

    web = True
    route = "/"
    pubsub = _PubSub()
    on_keyboard_event = None

    def run_task(self, func: Any, *args: Any, **kwargs: Any) -> asyncio.Task[Any] | None:
        result = func(*args, **kwargs)
        if asyncio.iscoroutine(result):
            return asyncio.create_task(result)
        return None

    def update(self) -> None:
        return None


class _HeadlessSettings:
    def __init__(self, app: "_HeadlessApp"):
        self.app = app
        self.config_manager = app.config_manager
        self.user_config = self.config_manager.load_user_config()
        self.default_config = self.config_manager.load_default_config()
        self.cookies_config = self.config_manager.load_cookies_config()
        self.accounts_config = self.config_manager.load_accounts_config()
        self.language_option = self.config_manager.load_language_config()
        self.language_code = self._language_code()

    def _language_code(self) -> str:
        if not self.language_option:
            return self.user_config.get("language", "zh_CN")
        _, default_language_code = list(self.language_option.items())[0]
        return self.language_option.get(self.user_config.get("language"), default_language_code)

    def get_config_value(self, key: str, default: Any = None) -> Any:
        return self.user_config.get(key, self.default_config.get(key, default))

    def get_video_save_path(self) -> str:
        live_save_path = self.get_config_value("live_save_path")
        return live_save_path or os.path.join(self.app.run_path, "downloads")


class _HeadlessApp:
    def __init__(self, page: _HeadlessPage):
        self.page = page
        self.run_path = execute_dir
        self.config_manager = ConfigManager(self.run_path)
        self.process_manager = AsyncProcessManager()
        self.subprocess_start_up_info = utils.get_startup_info()
        self.settings = _HeadlessSettings(self)
        self.language_code = self.settings.language_code
        self.language_manager = LanguageManager(self)
        self.recording_enabled = True
        self.is_web_mode = True
        self.is_mobile = False
        self.auth_manager = None
        self.current_username = "admin"
        self.tray_manager = SimpleNamespace(icon_path=None)
        self.record_card_manager = SimpleNamespace(
            update_card=lambda *_args, **_kwargs: None,
            remove_recording_card=lambda *_args, **_kwargs: None,
        )
        self.snack_bar = SimpleNamespace(show_snack_bar=lambda *_args, **_kwargs: None)
        self.update_checker = UpdateChecker(self)
        self.record_manager = RecordingManager(self)

    def add_ffmpeg_process(self, process: Any) -> None:
        self.process_manager.add_process(process)

    async def start_periodic_tasks(self) -> None:
        await self.record_manager.setup_periodic_live_check(
            int(self.record_manager.loop_time_seconds or 180)
        )


async def main() -> None:
    page = _HeadlessPage()
    streamcap = _HeadlessApp(page)

    auth_manager = AuthManager(streamcap)
    streamcap.auth_manager = auth_manager
    await auth_manager.initialize()

    dependencies._recording_manager = streamcap.record_manager
    dependencies._auth_manager = auth_manager
    dependencies._settings = streamcap.settings
    dependencies._flet_loop = asyncio.get_running_loop()

    await streamcap.start_periodic_tasks()

    api_port = int(os.getenv("API_PORT", "6007"))
    config = uvicorn.Config(api_app, host="0.0.0.0", port=api_port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    asyncio.run(main())
