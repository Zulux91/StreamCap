import queue
import threading
from dataclasses import dataclass, field
from typing import Any


@dataclass
class RecordingEvent:
    event_type: str
    rec_id: str
    data: dict[str, Any] = field(default_factory=dict)


class EventBus:
    _instance: "EventBus | None" = None

    def __init__(self):
        self._subscribers: list[queue.Queue] = []
        self._lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "EventBus":
        if not cls._instance:
            cls._instance = cls()
        return cls._instance

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue()
        with self._lock:
            self._subscribers.append(q)
        return q

    def unsubscribe(self, q: queue.Queue):
        with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)

    def publish(self, event: RecordingEvent):
        with self._lock:
            subscribers = list(self._subscribers)
        for q in subscribers:
            q.put_nowait(event)
