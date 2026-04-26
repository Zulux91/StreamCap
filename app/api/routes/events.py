import asyncio
import json
import queue

from fastapi import APIRouter, HTTPException, Query, Request
from sse_starlette.sse import EventSourceResponse

from ...core.events.event_bus import EventBus
from ..dependencies import _auth_manager

router = APIRouter()


@router.get("/events")
async def events_stream(
    request: Request,
    token: str = Query(...),
):
    if not _auth_manager or not _auth_manager.validate_session(token):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    async def event_generator():
        event_bus = EventBus.get_instance()
        q = event_bus.subscribe()
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.to_thread(q.get, True, 30.0)
                    # Serialize only JSON-safe data (exclude Recording objects)
                    safe_data = {k: v for k, v in event.data.items() if k != "recordings"}
                    yield {
                        "event": event.event_type,
                        "data": json.dumps(safe_data),
                    }
                except queue.Empty:
                    yield {"event": "heartbeat", "data": "{}"}
        finally:
            event_bus.unsubscribe(q)

    return EventSourceResponse(event_generator())
