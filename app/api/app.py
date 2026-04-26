from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import auth, events, platforms, recordings, settings, status, storage, videos

app = FastAPI(title="StreamCap API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(recordings.router, prefix="/api/recordings", tags=["recordings"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(platforms.router, prefix="/api/platforms", tags=["platforms"])
app.include_router(storage.router, prefix="/api/storage", tags=["storage"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(events.router, prefix="/api", tags=["events"])
app.include_router(status.router, prefix="/api", tags=["status"])
