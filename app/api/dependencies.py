import asyncio
from typing import Optional

from fastapi import Cookie, Header, HTTPException

_recording_manager = None
_auth_manager = None
_settings = None
_flet_loop: Optional[asyncio.AbstractEventLoop] = None


def get_recording_manager():
    return _recording_manager


def get_auth_manager():
    return _auth_manager


def get_settings():
    return _settings


def get_flet_loop() -> Optional[asyncio.AbstractEventLoop]:
    return _flet_loop


async def verify_session(
    authorization: str = Header(None),
    streamcap_token: str | None = Cookie(None, alias="streamcap-token"),
) -> dict:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ")
    elif streamcap_token:
        token = streamcap_token

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not _auth_manager or not _auth_manager.validate_session(token):
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return _auth_manager.active_sessions[token]


async def run_in_flet_loop(coro):
    """Run coroutine in Flet's event loop (thread-safe). Falls back to current loop."""
    loop = _flet_loop
    if loop and loop.is_running():
        future = asyncio.run_coroutine_threadsafe(coro, loop)
        return await asyncio.get_event_loop().run_in_executor(None, future.result)
    return await coro
