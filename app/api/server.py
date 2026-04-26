import asyncio
import os
from typing import Any

import uvicorn

from app.app_manager import App
from app.auth.auth_manager import AuthManager

from . import dependencies
from .app import app as api_app


class _PubSub:
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


async def main() -> None:
    page = _HeadlessPage()
    streamcap = App(page)  # type: ignore[arg-type]
    streamcap.is_web_mode = True
    streamcap.is_mobile = False

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
