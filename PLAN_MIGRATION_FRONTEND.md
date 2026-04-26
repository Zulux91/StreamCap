# StreamCap Frontend Migration Plan
## Migración a Next.js + React + Tailwind CSS + Glassmorphism

---

## 0. Estado de Implementación

| Fase | Estado | Notas |
|------|--------|-------|
| Fase 1: Setup Frontend | ✅ COMPLETA | 2026-04-25 |
| Fase 2: Refactoring Backend | ✅ COMPLETA | 2026-04-25 |
| Fase 3: Backend API REST | ✅ COMPLETA | 2026-04-25 |
| Fase 4: UI Components Base | ✅ COMPLETA | 2026-04-25 |
| Fase 5: Páginas y Features | ✅ COMPLETA | 2026-04-25 |
| Fase 6: Integration & Testing | 🟨 En progreso | 2026-04-25 — integración/lint/build OK; falta validación E2E manual |
| Fase 7: Polish & Deploy | ⬜ Pendiente | |

---

## 1. Resumen Ejecutivo

### 1.1 Objetivo
Migrar el frontend de StreamCap (actualmente en Flet/Python) a una interfaz web moderna construida con Next.js 16, React 19, Tailwind CSS v4 y diseño glassmorphism.

### 1.2 Scope
- **Incluye:** Frontend web completo + REST API backend + refactoring de RecordingManager
- **Excluye:** Lógica de grabación, platform handlers, FFmpeg builders
- **Preservación:** Todas las funcionalidades existentes de StreamCap

### 1.3 Stack Tecnológico

| Capa | Tecnología | Versión | Notas |
|------|------------|---------|-------|
| Framework | Next.js | **16.2.4** | App Router |
| UI Library | React | 19.2.4 | |
| Styling | Tailwind CSS | **4.x** | shadcn v4 ya soporta Tailwind v4 ✓ |
| UI Components | shadcn | **4.4.0** | Usa `@base-ui/react` (no Radix UI) |
| Glassmorphism | custom CSS | - | Utilities en `globals.css` |
| Server State | TanStack React Query | 5.100.x | Recordings, settings, storage |
| Client State | Zustand | 5.0.12 | Solo auth + UI state |
| HTTP Client | Axios | 1.15.x | |
| Video Player | video.js | 8.23.x | |
| Icons | Lucide React | **1.11.0** | API puede diferir de versiones antiguas |
| Forms | React Hook Form | 7.73.x | |
| Validation | Zod | **4.3.6** | ⚠️ Zod v4 — ver nota abajo |
| Form resolvers | @hookform/resolvers | **5.2.x** | ⚠️ v5 — ver nota abajo |
| Routing | Next.js App Router | - | |
| Backend API | FastAPI | 0.115.x | Extiende el existente |
| ASGI Server | Uvicorn | 0.32.x | |
| SSE Backend | sse-starlette | 2.1.x | Real-time events |

> **Stack real instalado** — versiones confirmadas con `package.json` del 2026-04-25.

> ⚠️ **Zod v4 breaking changes:** `z.string().nonempty()` → `z.string().min(1)`. `z.object().partial()` retorna tipos distintos. `.parse()` lanza `ZodError` con estructura diferente. Verificar [Zod v4 migration guide](https://zod.dev) antes de escribir schemas.

> ⚠️ **`@hookform/resolvers` v5:** Cambia la firma del resolver. Usar `zodResolver` de `@hookform/resolvers/zod` igual que antes, pero si hubo cambios internos verificar tipos.

> ⚠️ **Next.js 16 breaking change:** `middleware.ts` fue **renombrado a `proxy.ts`** y la función exportada es `proxy()` no `middleware()`. Ver sección 7.5 para auth protection.

---

## 2. Análisis del Sistema Actual

### 2.1 Arquitectura Actual

```
StreamCap (Flet/Python)
├── main.py                    # Entry point — Flet app
├── app/
│   ├── app_manager.py         # App class — mezcla UI + estado + business logic
│   ├── ui/                    # Capa UI Flet
│   │   ├── views/             # Pages: Home, Recordings, Settings, Storage, About
│   │   ├── components/        # RecordingCard, VideoPlayer, Dialogs
│   │   ├── navigation/        # Sidebar
│   │   └── themes/            # Theme management
│   ├── core/
│   │   ├── recording/         # RecordingManager, LiveStreamRecorder
│   │   ├── platforms/         # Platform handlers (60+)
│   │   └── media/             # FFmpeg builders
│   ├── models/                # Recording, RecordingStatus, VideoQuality
│   ├── auth/                  # AuthManager (web only)
│   └── messages/              # MessagePusher (8+ canales)
├── app/api/
│   └── video_stream_service.py  # FastAPI standalone — solo /api/videos
└── config/                    # JSON configs
```

### 2.2 Flujo de Datos Actual

```
Usuario -> Flet UI
            -> app.page.run_task() / page.pubsub    ← Flet-specific
            -> RecordingManager
                -> Platform Handlers
                -> FFmpeg / Direct Download
                -> File System (downloads/)
```

### 2.3 Problema Central: RecordingManager acoplado a Flet

`RecordingManager` tiene dependencias directas de Flet en ~15 sitios:
```python
self.app.page.run_task(...)              # scheduling async work
self.app.page.pubsub.send_others_on_topic("update", recording)
self.app.record_card_manager.update_card(recording)
self.app.snack_bar.show_snack_bar(...)
```

**Antes de exponer una REST API, hay que desacoplar estas dependencias.** Sin este trabajo, la Fase 3 (Backend API) no es implementable.

### 2.4 API Actual

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/videos?filename=&subfolder=` | Streaming con Range support, ETag, path traversal protection |

Puerto: 6007. Proceso separado (`video_stream_service.py`).

**Gap:** No existe REST API para el nuevo frontend. Todo corre en proceso único con Flet.

### 2.5 Modelo de Datos: Recording

```python
# Campos persistidos en recordings.json
{
    rec_id: str,               # UUID
    url: str,                  # URL del stream
    streamer_name: str,
    quality: str,              # OD|UHD|HD|SD|LD
    record_format: str,        # TS|MP4|FLV|MKV|MOV|NUT
    segment_record: bool,
    segment_time: int,
    monitor_status: bool,
    scheduled_recording: bool,
    scheduled_start_time: str, # "HH:MM" o "HH:MM,HH:MM,..."
    monitor_hours: str,        # horas desde scheduled_start, separadas por coma
    recording_dir: str,        # directorio custom (vacío = default)
    enabled_message_push: bool,
    only_notify_no_record: bool,
    flv_use_direct_download: bool,
    platform: str,             # nombre display de plataforma
    platform_key: str          # key identificador de plataforma
}

# Campos runtime — NO persistidos, calculados en memoria
{
    is_live: bool,
    is_recording: bool,
    is_checking: bool,
    status_info: RecordingStatus,
    display_title: str,
    speed: str,                # "X KB/s"
    cumulative_duration: timedelta,
    start_time: datetime,
    loop_time_seconds: int,    # viene de settings globales, no por recording
    live_title: str,
    preview_url: str
}
```

> **Nota sobre `loop_time_seconds`:** No es un campo editable por recording. Se hereda de `user_settings.json → loop_time_seconds` globalmente. La API no debe exponerlo como campo editable en PUT /recordings/:id.

### 2.6 RecordingStatus State Machine

```
STATUS_CHECKING -> MONITORING -> PREPARING_RECORDING -> RECORDING -> NOT_RECORDING
      |                |                |
      v                v                v
CHECK_ERROR      STOPPED_MONITORING   RECORDING_ERROR
                                    |
                                    v
                            NOT_RECORDING_SPACE
```

Estados adicionales: `LIVE_BROADCASTING` (live pero `only_notify_no_record=True`), `NOT_IN_SCHEDULED_CHECK`.

### 2.7 Authentication Actual

- SHA-256 + salt, almacenado en `web_auth.json`
- Credenciales default: admin/admin
- `active_sessions`: dict en memoria — **sin TTL, sin persistencia**
- Reiniciar backend destruye todas las sesiones activas

### 2.8 Configuraciones

| Archivo | Propósito |
|---------|-----------|
| `user_settings.json` | Settings globales del usuario |
| `recordings.json` | Lista de recordings |
| `cookies.json` | Cookies por plataforma |
| `accounts.json` | Credenciales de plataformas |
| `web_auth.json` | Users/passwords para web auth |
| `language.json` | Idiomas disponibles |
| `version.json` | Versión de la app |

### 2.9 Notificaciones Push Soportadas

DingTalk, WeChat (enterprise), Feishu, ServerChan, Email (SMTP), Bark, Ntfy, Telegram.

---

## 3. Arquitectura del Nuevo Sistema

### 3.1 Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (React)                      │
│  Pages, Components, Glassmorphism Styles                │
├─────────────────────────────────────────────────────────┤
│           Server State (TanStack React Query)            │
│  Recordings, Settings, Storage, Platforms               │
├─────────────────────────────────────────────────────────┤
│           Client State (Zustand — mínimo)               │
│  auth-store, ui-store                                   │
├─────────────────────────────────────────────────────────┤
│                  Services Layer (Axios)                  │
│  recording-service, settings-service, auth-service, ... │
├─────────────────────────────────────────────────────────┤
│               Next.js API Routes (Proxy)                │
│  Manejo de CORS, auth headers, cookie management        │
├─────────────────────────────────────────────────────────┤
│              Backend Python (FastAPI)                   │
│  REST API + SSE endpoint + RecordingManager desacoplado │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Separación de Responsabilidades de Estado

| Tipo de estado | Herramienta | Ejemplos |
|----------------|-------------|----------|
| Server state (async, cached) | React Query | recordings, settings, platforms, storage |
| Auth state | Zustand | token, username, isAuthenticated |
| UI state | Zustand | sidebar open/closed, theme, selected recordings |
| Forms | React Hook Form | add/edit recording dialog |

**No usar Zustand para datos que vienen del servidor.** React Query ya maneja caching, invalidation, y refetch.

### 3.3 Flujo de Datos Propuesto

```
React UI
  │
  ├── React Query hooks (useRecordings, useSettings, etc.)
  │     └── Axios services → FastAPI backend
  │
  ├── SSE EventSource → /api/events
  │     └── Invalidate React Query cache en eventos
  │
  └── Zustand (auth-store, ui-store)
        └── Persisted en localStorage
```

### 3.4 Estructura de Archivos Frontend

```
frontend/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx             # Shell con sidebar
│   │   │   ├── home/
│   │   │   │   └── page.tsx
│   │   │   ├── recordings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx           # Tab wrapper
│   │   │   │   ├── recording/page.tsx
│   │   │   │   ├── push/page.tsx
│   │   │   │   ├── cookies/page.tsx
│   │   │   │   ├── accounts/page.tsx
│   │   │   │   └── security/page.tsx
│   │   │   ├── storage/
│   │   │   │   └── page.tsx
│   │   │   └── about/
│   │   │       └── page.tsx
│   │   ├── api/                       # Next.js proxy routes
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui base
│   │   ├── glass/                     # Custom glassmorphism
│   │   │   ├── glass-card.tsx
│   │   │   ├── glass-sidebar.tsx
│   │   │   ├── glass-button.tsx
│   │   │   ├── glass-input.tsx
│   │   │   ├── glass-dialog.tsx
│   │   │   ├── glass-dropdown.tsx
│   │   │   └── glass-tabs.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── main-layout.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── features/
│   │       ├── recording/
│   │       │   ├── recording-card.tsx
│   │       │   ├── recording-list.tsx
│   │       │   ├── recording-dialog.tsx
│   │       │   ├── recording-filters.tsx
│   │       │   └── recording-stats.tsx
│   │       ├── video/
│   │       │   ├── video-player.tsx
│   │       │   ├── video-grid.tsx
│   │       │   └── video-preview.tsx
│   │       ├── home/
│   │       │   ├── dashboard-stats.tsx
│   │       │   ├── quick-actions.tsx
│   │       │   └── announcements.tsx
│   │       ├── settings/
│   │       │   ├── recording-settings.tsx
│   │       │   ├── push-settings.tsx
│   │       │   ├── cookie-manager.tsx
│   │       │   └── account-manager.tsx
│   │       └── storage/
│   │           ├── file-browser.tsx
│   │           ├── file-item.tsx
│   │           └── storage-stats.tsx
│   │
│   ├── hooks/
│   │   ├── use-recordings.ts          # React Query
│   │   ├── use-platforms.ts           # React Query
│   │   ├── use-settings.ts            # React Query
│   │   ├── use-storage.ts             # React Query
│   │   ├── use-auth.ts                # Zustand auth-store wrapper
│   │   └── use-realtime.ts            # SSE EventSource + Query invalidation
│   │
│   ├── services/
│   │   ├── api.ts                     # Axios instance con interceptors
│   │   ├── auth-service.ts
│   │   ├── recording-service.ts
│   │   ├── settings-service.ts
│   │   ├── storage-service.ts
│   │   └── platform-service.ts
│   │
│   ├── stores/
│   │   ├── auth-store.ts              # token, username, isAuthenticated
│   │   └── ui-store.ts                # theme, sidebar state, selected recordings
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── cn.ts                      # clsx + tailwind-merge
│   │   ├── format-duration.ts
│   │   ├── format-file-size.ts
│   │   └── format-date.ts
│   │
│   └── types/
│       ├── recording.ts
│       ├── settings.ts
│       ├── platform.ts
│       ├── api.ts
│       └── auth.ts
│
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

### 3.5 Estructura de Archivos Backend (Nueva)

```
app/
├── api/
│   ├── __init__.py
│   ├── app.py                  # FastAPI app principal (reemplaza video_stream_service.py standalone)
│   ├── dependencies.py         # get_recording_manager, get_auth_manager, verify_session
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── recordings.py
│   │   ├── settings.py
│   │   ├── platforms.py
│   │   ├── storage.py
│   │   ├── videos.py           # Migrado de video_stream_service.py
│   │   └── events.py           # SSE endpoint
│   └── schemas/
│       ├── __init__.py
│       ├── recording.py        # Pydantic models
│       ├── settings.py
│       ├── auth.py
│       └── events.py
└── core/
    ├── recording/
    │   ├── record_manager.py   # Refactorizado — sin dependencias Flet
    │   └── stream_manager.py
    └── events/
        ├── __init__.py
        └── event_bus.py        # Nuevo: EventBus para desacoplar UI de business logic
```

---

## 4. Fase 2.0: Refactoring RecordingManager (PREREQUISITO)

> **Esta fase debe completarse antes de implementar la REST API. Es el trabajo más riesgoso.**

### 4.1 Problema

`RecordingManager` llama directamente a Flet en ~15 lugares. Ejemplos:

```python
# record_manager.py — dependencias Flet a eliminar
self.app.page.run_task(self.app.record_card_manager.update_card, recording)
self.app.page.pubsub.send_others_on_topic("update", recording)
self.app.snack_bar.show_snack_bar(self._["not_disk_space_tip"], ...)
self.app.page.run_task(self.persist_recordings)
self.app.page.run_task(self.check_if_live, recording)
```

### 4.2 Solución: EventBus

Crear `app/core/events/event_bus.py` — bus de eventos async que:
1. Reemplaza `page.pubsub` para eventos de recording
2. Alimenta el SSE endpoint en la API
3. Permite que Flet UI siga suscribiéndose (backwards compatible durante transición)

```python
# app/core/events/event_bus.py
import asyncio
from dataclasses import dataclass
from typing import Any

@dataclass
class RecordingEvent:
    event_type: str   # "recording_started" | "recording_stopped" | "stream_live" | etc.
    rec_id: str
    data: dict[str, Any]

class EventBus:
    _instance = None

    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []

    @classmethod
    def get_instance(cls) -> "EventBus":
        if not cls._instance:
            cls._instance = cls()
        return cls._instance

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self._subscribers.remove(q)

    async def publish(self, event: RecordingEvent):
        for q in self._subscribers:
            await q.put(event)
```

### 4.3 Cambios en RecordingManager

| Antes (Flet) | Después (desacoplado) |
|---|---|
| `self.app.page.run_task(fn, *args)` | `asyncio.create_task(fn(*args))` |
| `self.app.page.pubsub.send_others_on_topic("update", rec)` | `await event_bus.publish(RecordingEvent("recording_updated", rec.rec_id, rec.to_dict()))` |
| `self.app.record_card_manager.update_card(rec)` | Eliminar — Flet UI suscribe al EventBus |
| `self.app.snack_bar.show_snack_bar(msg)` | `await event_bus.publish(RecordingEvent("alert", "", {"message": msg}))` |
| `self.app.page.run_task(self.persist_recordings)` | `asyncio.create_task(self.persist_recordings())` |

### 4.4 Compatibilidad con Flet UI

Durante la transición, el `App` de Flet suscribe al EventBus y redirige eventos a los componentes Flet existentes:

```python
# app/app_manager.py — adaptador temporal
async def _bridge_events(self):
    q = EventBus.get_instance().subscribe()
    while True:
        event = await q.get()
        if event.event_type == "recording_updated":
            recording = self.record_manager.find_recording_by_id(event.rec_id)
            if recording:
                self.page.run_task(self.record_card_manager.update_card, recording)
        elif event.event_type == "alert":
            self.page.run_task(self.snack_bar.show_snack_bar, event.data["message"])
```

Esto preserva el comportamiento Flet actual mientras habilita la REST API en paralelo.

### 4.5 Entregables Fase 2.0

- [ ] `EventBus` implementado
- [ ] `RecordingManager` sin imports ni llamadas a Flet
- [ ] Bridge adapter en `App` manteniendo comportamiento Flet
- [ ] Tests de integración: start/stop monitoring, recording lifecycle
- [ ] Flet desktop mode sigue funcionando

---

## 5. Backend API — Endpoints

### 5.1 Gap Analysis

**Existe:**
- `GET /api/videos?filename=&subfolder=` (Range support, ETag, TTLCache)

**Falta todo lo demás.** La nueva API integrará el video endpoint existente en el mismo proceso FastAPI.

### 5.2 Auth Endpoints

| Método | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/auth/login` | `{username, password}` | `{token, username, is_admin}` |
| POST | `/api/auth/logout` | Header: `Authorization: Bearer <token>` | `{success}` |
| GET | `/api/auth/session` | Header: `Authorization: Bearer <token>` | `{valid, username, is_admin}` |
| PUT | `/api/auth/password` | `{old_password, new_password}` | `{success}` |

**Implementación de sesiones:** Usar `cachetools.TTLCache` con TTL de 24h para `active_sessions`. Añadir `login_at` al session dict para auditoría.

```python
# Reemplazar dict plano con TTLCache
from cachetools import TTLCache
self.active_sessions = TTLCache(maxsize=100, ttl=86400)  # 24h
```

### 5.3 Recording Endpoints

| Método | Path | Descripción | Notes |
|--------|------|-------------|-------|
| GET | `/api/recordings` | Lista todos | Query: `?status=&platform=&search=` |
| GET | `/api/recordings/{id}` | Single recording | Incluye campos runtime (is_live, is_recording, etc.) |
| POST | `/api/recordings` | Crear | Body: campos persistidos + opcionales |
| PUT | `/api/recordings/{id}` | Actualizar | Partial update |
| DELETE | `/api/recordings/{id}` | Eliminar single | |
| POST | `/api/recordings/{id}/start` | Start monitoring | |
| POST | `/api/recordings/{id}/stop` | Stop monitoring | |
| POST | `/api/recordings/batch/delete` | Batch delete | Body: `{ids: [...]}` |
| POST | `/api/recordings/batch/start` | Batch start monitoring | Body: `{ids: []}` → vacío = todos |
| POST | `/api/recordings/batch/stop` | Batch stop monitoring | Body: `{ids: []}` → vacío = todos |

> **Nota HTTP:** Batch delete usa `POST /batch/delete`, no `DELETE` con body. DELETE con body no está prohibido por HTTP pero muchos proxies/clientes lo truncan.

**Response schema de recording (GET):**

```typescript
interface RecordingResponse {
  // Campos persistidos
  rec_id: string;
  url: string;
  streamer_name: string;
  quality: "OD" | "UHD" | "HD" | "SD" | "LD";
  record_format: "TS" | "MP4" | "FLV" | "MKV" | "MOV" | "NUT";
  segment_record: boolean;
  segment_time: number;
  monitor_status: boolean;
  scheduled_recording: boolean;
  scheduled_start_time: string;
  monitor_hours: string;
  recording_dir: string;
  enabled_message_push: boolean;
  only_notify_no_record: boolean;
  flv_use_direct_download: boolean;
  platform: string | null;
  platform_key: string | null;
  // Campos runtime (solo lectura)
  is_live: boolean;
  is_recording: boolean;
  is_checking: boolean;
  status_info: string | null;
  display_title: string;
  speed: string;
  cumulative_duration_seconds: number;
}
```

### 5.4 Settings Endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/settings` | Todos los settings del usuario |
| PUT | `/api/settings` | Update parcial (key/value o bulk) |
| GET | `/api/settings/defaults` | Default settings |
| GET | `/api/settings/languages` | Idiomas disponibles |
| GET | `/api/settings/cookies` | Cookies config |
| PUT | `/api/settings/cookies` | Update cookies |
| GET | `/api/settings/accounts` | Accounts config |
| PUT | `/api/settings/accounts` | Update accounts |

### 5.5 Platform Endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/platforms` | Lista plataformas soportadas |
| GET | `/api/platforms/detect?url=` | Detecta plataforma de URL |

### 5.6 Storage Endpoints

| Método | Path | Descripción | Security |
|--------|------|-------------|----------|
| GET | `/api/storage/browse?path=` | Lista directorio | Path debe ser relativo a VIDEO_DIR; validar con `.relative_to()` |
| GET | `/api/storage/stats` | Stats de almacenamiento | |
| POST | `/api/storage/delete` | Elimina archivo | Body: `{path: string}`; misma validación de path |
| GET | `/api/videos?filename=&subfolder=` | Stream video | **Mantener firma original** |
| GET | `/api/videos/list?path=` | Lista videos en directorio | |

> **Seguridad storage:** Todo path recibido del cliente debe validarse con `resolved_path.relative_to(VIDEO_DIR)`. Si lanza `ValueError` → 400. Mismo patrón ya implementado en `video_stream_service.py`.

> **Nota:** No usar `DELETE /api/storage/file` con body — usar `POST /api/storage/delete`.

### 5.7 Status / Health Endpoints

| Método | Path | Response |
|--------|------|----------|
| GET | `/api/health` | `{status: "ok", version: string}` |
| GET | `/api/status` | `{active_recordings: int, live_streams: int, monitoring: int, recording_enabled: bool}` |
| GET | `/api/updates/check` | `{has_update: bool, latest_version: string, current_version: string, release_url: string}` |

### 5.8 SSE — Real-time Events

**Endpoint:** `GET /api/events`
**Auth:** Bearer token en query param `?token=` (EventSource no soporta custom headers)

**Eventos emitidos:**

```typescript
// Schema base
interface SSEEvent {
  event: EventType;
  data: string; // JSON serializado
}

// Tipos de eventos y sus payloads
type EventType =
  | "recording_updated"   // cualquier cambio de estado en un recording
  | "stream_live"         // stream pasó a is_live=true
  | "stream_offline"      // stream pasó a is_live=false
  | "recording_started"   // is_recording pasó a true
  | "recording_stopped"   // is_recording pasó a false
  | "recording_error"     // status CHECK_ERROR o RECORDING_ERROR
  | "space_warning"       // disco lleno / recording_enabled=false
  | "heartbeat";          // ping cada 30s para mantener conexión

// Payload de recording_updated, stream_live, recording_started, etc.
interface RecordingEventData {
  rec_id: string;
  status_info: string;
  is_live: boolean;
  is_recording: boolean;
  is_checking: boolean;
  display_title: string;
  speed: string;
  cumulative_duration_seconds: number;
}

// Payload de space_warning
interface SpaceWarningData {
  message: string;
  recording_enabled: boolean;
}
```

**Implementación SSE con sse-starlette:**

```python
# app/api/routes/events.py
from sse_starlette.sse import EventSourceResponse
from ...core.events.event_bus import EventBus

@router.get("/api/events")
async def events_stream(token: str, request: Request):
    # Verificar token antes de conectar
    if not auth_manager.validate_session(token):
        raise HTTPException(status_code=401)

    async def event_generator():
        q = EventBus.get_instance().subscribe()
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(q.get(), timeout=30.0)
                    yield {"event": event.event_type, "data": json.dumps(event.data)}
                except asyncio.TimeoutError:
                    yield {"event": "heartbeat", "data": "{}"}
        finally:
            EventBus.get_instance().unsubscribe(q)

    return EventSourceResponse(event_generator())
```

**Frontend — consumir SSE:**

```typescript
// hooks/use-realtime.ts
export function useRealtime() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;
    const es = new EventSource(`/api/events?token=${token}`);

    es.addEventListener("recording_updated", (e) => {
      const data = JSON.parse(e.data);
      // Actualizar el cache de React Query en lugar de re-fetch
      queryClient.setQueryData(["recordings"], (old: Recording[]) =>
        old?.map((r) => (r.rec_id === data.rec_id ? { ...r, ...data } : r))
      );
    });

    es.addEventListener("stream_live", () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    });

    return () => es.close();
  }, [token, queryClient]);
}
```

### 5.9 Dependencias Backend Adicionales

```toml
# Agregar a pyproject.toml
fastapi = ">=0.115.0,<0.116.0"
uvicorn = { extras = ["standard"], version = ">=0.32.0,<0.33.0" }
sse-starlette = ">=2.1.0,<3.0.0"
python-multipart = ">=0.0.21,<0.1.0"
cachetools = ">=5.3.0"  # ya en dependencias para video_stream_service
```

---

## 6. Design System

### 6.1 Glassmorphism — Principios

- Fondos translúcidos con `backdrop-filter: blur()`
- Bordes sutiles con gradientes semi-transparentes
- Profundidad a través de capas
- Animaciones suaves (200-300ms, ease-out)

### 6.2 Color Palette

> **Implementado.** Colores en formato **OKLCH** (Tailwind v4 usa OKLCH por defecto, no HSL). Ver `frontend/app/globals.css`.

```css
/* OKLCH — purple primary */
:root {
  --primary: oklch(0.55 0.23 282);   /* violet-600 equiv */
  --ring:    oklch(0.55 0.23 282);
}
.dark {
  --primary: oklch(0.65 0.2 282);
}

/* Glass utilities implementadas como @layer utilities en globals.css */
/* .glass, .glass-sm, .glass-lg, .glass-shadow, .glass-shadow-hover  */
/* .status-recording, .status-live, .status-checking, .status-stopped, .status-error */
```

### 6.3 Typography

Font: Inter (Google Fonts) + system-ui fallback.

| Elemento | Size | Weight |
|---------|------|--------|
| h1 | 2.25rem | 700 |
| h2 | 1.875rem | 600 |
| h3 | 1.5rem | 600 |
| body | 1rem | 400 |
| small | 0.875rem | 400 |
| caption | 0.75rem | 400 |

### 6.4 Glassmorphism Components

```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
.dark .glass-card {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

.glass-sidebar {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  width: 260px;
}

.glass-button {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}
.glass-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}
```

### 6.5 Animaciones

| Animation | Duration | Easing | Uso |
|-----------|----------|--------|-----|
| fade-in | 200ms | ease-out | Entrada de elementos |
| slide-up | 300ms | ease-out | Modales/dialogs |
| scale-in | 200ms | ease-out | Hover cards |
| glass-shimmer | 2s | linear | Loading states |

### 6.6 Responsive Breakpoints

Estándar Tailwind: sm(640) / md(768) / lg(1024) / xl(1280) / 2xl(1536).

### 6.7 Dark/Light Mode

1. CSS variables para colores (sección 6.2)
2. `class="dark"` en `<html>` para dark mode
3. `prefers-color-scheme` en media query para detection automática
4. Toggle manual en sidebar
5. Persistencia en localStorage via `ui-store`

---

## 7. Plan de Implementación por Fases

### ✅ Fase 1: Setup Frontend — COMPLETA (2026-04-25)

#### Lo que se hizo

```bash
npx create-next-app@latest frontend --typescript --eslint --tailwind --app --import-alias "@/*"
npx shadcn@latest init --defaults
npx shadcn@latest add button card dialog input select switch tabs tooltip badge dropdown-menu separator scroll-area skeleton
npm install zustand axios @tanstack/react-query react-hook-form @hookform/resolvers zod video.js lucide-react date-fns react-hot-toast
npm install -D @types/video.js prettier prettier-plugin-tailwindcss
```

#### Notas de la instalación real

**Tailwind v4 + shadcn v4 compatible:** No fue necesario bajar a v3. shadcn 4.4.0 detecta y soporta Tailwind v4 correctamente.

**`tailwind.config.ts` no existe** en Tailwind v4. La configuración va en `globals.css` via `@theme inline {}`. No intentar crear `tailwind.config.ts` — rompe la build.

**`@base-ui/react`** reemplaza todos los `@radix-ui/*`. shadcn ahora usa Base UI como primitives. Si se necesita usar primitives directamente importar de `@base-ui/react`, no de `@radix-ui`.

**Dark mode syntax** en Tailwind v4:
```css
@custom-variant dark (&:is(.dark *));  /* en globals.css */
```
No usar `darkMode: "class"` en config (no hay config file).

**CSS variables usan OKLCH**, no HSL. Conversión: HSL(262, 83%, 58%) ≈ `oklch(0.55 0.23 282)`.

#### Archivos creados

```
frontend/
├── app/globals.css              # Design tokens OKLCH + glass utilities
├── app/layout.tsx               # Root layout con Providers
├── app/page.tsx                 # Redirect → /home
├── components/
│   ├── providers.tsx            # QueryClient + ThemeProvider + Toaster
│   └── ui/                      # 13 shadcn components
├── hooks/
│   ├── use-recordings.ts        # React Query (CRUD + batch + optimistic updates)
│   ├── use-settings.ts          # React Query
│   ├── use-auth.ts              # Zustand auth-store wrapper
│   ├── use-platforms.ts         # React Query
│   ├── use-storage.ts           # React Query
│   └── use-realtime.ts          # SSE EventSource + reconnect exponencial
├── services/
│   ├── api.ts                   # Axios instance con interceptors (401 → redirect)
│   ├── auth-service.ts
│   ├── recording-service.ts
│   ├── settings-service.ts
│   ├── platform-service.ts
│   └── storage-service.ts
├── stores/
│   ├── auth-store.ts            # Zustand persist (token, username, isAdmin)
│   └── ui-store.ts              # Zustand persist (theme, sidebar, selection)
├── types/
│   ├── recording.ts             # Recording, CreateRecordingInput, RecordingStatus
│   ├── auth.ts
│   ├── settings.ts
│   ├── platform.ts
│   ├── api.ts                   # StorageEntry, StorageStats, AppStatus, etc.
│   └── events.ts                # SSEEventType, RecordingEventData, SpaceWarningData
├── lib/
│   ├── format-duration.ts
│   ├── format-file-size.ts
│   └── format-date.ts
├── .env.local                   # NEXT_PUBLIC_API_URL=http://localhost:6007
└── prettier.config.js
```

**Estado:** TypeScript 0 errores. `npm run build` limpio.

#### Dependencias reales instaladas

```json
{
  "dependencies": {
    "@base-ui/react": "^1.4.1",
    "@hookform/resolvers": "^5.2.2",
    "@tanstack/react-query": "^5.100.1",
    "axios": "^1.15.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^1.11.0",
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.73.1",
    "react-hot-toast": "^2.6.0",
    "shadcn": "^4.4.0",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0",
    "video.js": "^8.23.7",
    "zod": "^4.3.6",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/video.js": "^7.3.58",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "prettier": "^3.8.3",
    "prettier-plugin-tailwindcss": "^0.7.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Entregables:**
- [x] Next.js 16 compilando sin errores
- [x] shadcn/ui 4.4.0 instalado con 13 componentes
- [x] Design tokens OKLCH en `globals.css`
- [x] Glass utilities (`.glass`, `.glass-sm`, `.glass-lg`)
- [x] Estructura de carpetas completa
- [x] Types, stores, services, hooks base
- [x] SSE hook con reconnect exponencial
- [x] Optimistic updates en recording mutations

---

### Fase 2: Refactoring Backend (Semana 1-2) — CRÍTICO ⬜

Ver sección 4 para detalle completo.

> **Contexto del entorno real:** Node.js 22.5.1 en la máquina. Python y Flet ya corriendo en puerto 6006. La API FastAPI irá en puerto 6007 (ya usado por `video_stream_service.py`). El nuevo `app/api/app.py` debe absorber ese endpoint.

#### 2.1 Implementar EventBus

- Crear `app/core/events/event_bus.py`
- Singleton con `asyncio.Queue` por suscriptor

#### 2.2 Desacoplar RecordingManager

- Reemplazar todas las llamadas `app.page.run_task()` → `asyncio.create_task()`
- Reemplazar `page.pubsub` → `EventBus.publish()`
- Reemplazar `record_card_manager.update_card()` → evento `recording_updated`
- Reemplazar `snack_bar.show_snack_bar()` → evento `alert`

#### 2.3 Bridge adapter en App (Flet compat)

- Suscribir `App` al EventBus
- Redirigir eventos a componentes Flet existentes

#### 2.4 Verificar modo desktop

- Ejecutar StreamCap en modo desktop
- Verificar que todas las funcionalidades siguen operando

**Entregables:**
- [x] RecordingManager sin imports de Flet
- [x] EventBus funcional
- [x] Desktop mode intacto (bridge adapter en App)
- [ ] Tests de lifecycle de recording

---

### Fase 3: Backend API REST (Semana 2-3) ⬜

> **Requiere Fase 2 completa** (RecordingManager desacoplado de Flet).

> **Puerto:** El nuevo `app/api/app.py` reemplaza `video_stream_service.py` en puerto 6007. Migrar el endpoint `/api/videos` al nuevo app — no correr dos instancias FastAPI.

#### 3.1 Crear FastAPI app principal

```python
# app/api/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, recordings, settings, platforms, storage, videos, events

app = FastAPI(title="StreamCap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(recordings.router, prefix="/api/recordings")
app.include_router(settings.router, prefix="/api/settings")
app.include_router(platforms.router, prefix="/api/platforms")
app.include_router(storage.router, prefix="/api/storage")
app.include_router(videos.router, prefix="/api/videos")
app.include_router(events.router, prefix="/api")
```

#### 3.2 Implementar dependencies.py

```python
# app/api/dependencies.py
from fastapi import Depends, HTTPException, Header
from ..core.recording.record_manager import RecordingManager
from ..auth.auth_manager import AuthManager

_recording_manager: RecordingManager = None
_auth_manager: AuthManager = None

def get_recording_manager() -> RecordingManager:
    return _recording_manager

def get_auth_manager() -> AuthManager:
    return _auth_manager

async def verify_session(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ")
    if not _auth_manager.validate_session(token):
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return _auth_manager.active_sessions[token]
```

#### 3.3 Implementar endpoints por módulo

Orden de implementación:
1. `auth.py` — login/logout/session/password
2. `recordings.py` — CRUD + start/stop + batch
3. `settings.py` — GET/PUT user_settings, cookies, accounts
4. `platforms.py` — list + detect
5. `storage.py` — browse + stats + delete
6. `videos.py` — migrar de `video_stream_service.py`
7. `events.py` — SSE con EventBus

#### 3.4 Integración en main.py

```python
# Modo web: iniciar FastAPI en thread separado junto a Flet
import threading
import uvicorn
from app.api.app import app as api_app
from app.api import dependencies

def start_api(recording_manager, auth_manager):
    dependencies._recording_manager = recording_manager
    dependencies._auth_manager = auth_manager
    uvicorn.run(api_app, host="0.0.0.0", port=6007, log_level="warning")

# En main() después de inicializar App:
if is_web:
    api_thread = threading.Thread(
        target=start_api,
        args=(app.record_manager, app.auth_manager),
        daemon=True
    )
    api_thread.start()
```

**Entregables:**
- [x] Todos los endpoints funcionando
- [x] SSE endpoint emitiendo eventos
- [x] Autenticación con TTL correcto (TTLCache 24h)
- [x] Path traversal protection en storage endpoints

---

### Fase 4: Componentes UI Base (Semana 3) ⬜

> **Nota `@base-ui/react`:** shadcn v4 usa Base UI como primitives en lugar de Radix UI. Los componentes shadcn ya generados (button, card, etc.) son correctos. Si se necesita usar primitives directamente (Dialog, Select, etc.) importar de `@base-ui/react` — la API es similar a Radix pero no idéntica. Consultar [base-ui.com/react](https://base-ui.com) antes de implementar componentes custom.

> **Tailwind v4 class syntax:** Dark mode via `dark:` prefix funciona igual. `@apply` en CSS funciona igual. Lo que cambia: no hay `tailwind.config.ts`, extensiones van en `globals.css` bajo `@theme inline {}`.

#### 4.1 Glassmorphism Components

Crear en `components/glass/`. Las glass utilities ya están en `globals.css`:
- `.glass` → `backdrop-filter: blur(16px)`, bg rgba white/black
- `.glass-sm` → blur 8px
- `.glass-lg` → blur 20px

Los componentes glass deben **combinar** las utilities con clases Tailwind:

```typescript
// glass-card.tsx
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: "sm" | "md" | "lg";
}

export function GlassCard({ blur = "md", className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        blur === "sm" ? "glass-sm" : blur === "lg" ? "glass-lg" : "glass",
        "glass-shadow rounded-xl p-4",
        className
      )}
      {...props}
    />
  );
}
```

Componentes a crear: `glass-card`, `glass-button`, `glass-input`, `glass-dialog`, `glass-dropdown`, `glass-sidebar`, `glass-tabs`, `glass-tooltip`.

Cada componente:
- Props bien tipadas con variantes CVA
- Soporte dark/light mode via CSS variables (ya definidas)
- Focus states para accesibilidad (no solo `:hover`)
- Animaciones via `tw-animate-css` (ya instalado) o Tailwind `transition-*`

#### 4.2 Layout Components

1. `sidebar.tsx` — navigation con glass effect, collapse en mobile
2. `header.tsx` — breadcrumb + user menu
3. `main-layout.tsx` — sidebar + header wrapper
4. `mobile-nav.tsx` — drawer bottom navigation

#### 4.3 React Query — ya configurado

`QueryClientProvider` ya está en `components/providers.tsx` con `staleTime: 5000`, `retry: 2`, `refetchOnWindowFocus: false`. No recrear.

**Entregables:**
- [x] Todos los glassmorphism components implementados
- [x] Layout responsivo funcionando
- [x] Dark/light mode toggle

---

### Fase 5: Páginas y Features (Semana 3-5) ⬜

#### 5.1 Auth Flow

```
app/(auth)/login/page.tsx
components/auth/login-form.tsx   ← React Hook Form + Zod v4
hooks/use-auth.ts                ← YA IMPLEMENTADO
stores/auth-store.ts             ← YA IMPLEMENTADO
```

> **Zod v4 schemas — sintaxis actualizada:**
> ```typescript
> // Zod v4
> const loginSchema = z.object({
>   username: z.string().min(1, "Required"),   // no .nonempty()
>   password: z.string().min(1, "Required"),
> });
> ```

> **⚠️ Next.js 16: Protección de rutas usa `proxy.ts`, NO `middleware.ts`:**
> ```typescript
> // proxy.ts (en raíz del proyecto — NO middleware.ts)
> import { NextResponse } from "next/server";
> import type { NextRequest } from "next/server";
>
> export function proxy(request: NextRequest) {
>   const { pathname } = request.nextUrl;
>   const isAuthRoute = pathname.startsWith("/(auth)") || pathname === "/login";
>   const token = request.cookies.get("auth-token")?.value;
>
>   if (!isAuthRoute && !token) {
>     return NextResponse.redirect(new URL("/login", request.url));
>   }
>   return NextResponse.next();
> }
>
> export const config = {
>   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
> };
> ```
> La función exportada se llama `proxy`, no `middleware`.

Flujo:
1. Check `auth-store` → si tiene token, validar con `GET /api/auth/session`
2. Si válido → redirect a `/home`
3. Si inválido → limpiar store + mostrar login
4. Login exitoso → guardar token en auth-store (persiste en localStorage)
5. Protected routes via `proxy.ts` (Next.js 16)

#### 5.2 Home Page

Features:
- Stats cards: total recordings, live, grabando, detenidos
- Quick actions: add recording, start all, stop all
- Announcements / update notification
- `useRealtime()` hook activo en layout principal

#### 5.3 Recordings Page

Features:
- Grid/list view toggle (persistido en `ui-store`)
- Filtros: status, platform, search
- Selección múltiple para batch operations
- RecordingCard con status en tiempo real via SSE
- Add/Edit dialog

**RecordingCard specs:**

```typescript
interface RecordingCardProps {
  recording: RecordingResponse;
  selected: boolean;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Elementos visuales:
// - Borde color-coded por status (verde=recording, azul=live, gris=stopped, rojo=error)
// - Platform badge
// - Streamer name + display_title
// - Duration (live si is_recording=true)
// - Speed badge
// - Quality badge
// - Action buttons con tooltips
```

**Optimistic updates para start/stop:**

```typescript
// recording-service.ts
async function startMonitoring(id: string) {
  // Optimistic update en React Query cache
  queryClient.setQueryData(["recordings"], (old) =>
    old.map((r) => r.rec_id === id ? { ...r, monitor_status: true, status_info: "STATUS_CHECKING" } : r)
  );
  try {
    await api.post(`/api/recordings/${id}/start`);
  } catch (e) {
    queryClient.invalidateQueries({ queryKey: ["recordings"] }); // rollback
    throw e;
  }
}
```

#### 5.4 Storage Page

Features:
- Directory tree navigation (breadcrumb)
- Lista con iconos por tipo (video, folder)
- Preview inline de video
- File size + fecha
- Storage stats summary (usado/total/disponible)

#### 5.5 Video Player

```typescript
// Soporte: MP4, TS, FLV, MKV (via video.js)
// URL del video: GET /api/videos?filename=&subfolder=
// El Content-Type del endpoint es video/mp4 independientemente del formato
// video.js maneja la decodificación si el browser lo soporta
```

Para FLV/TS en browsers sin soporte nativo: considerar `flv.js` o `hls.js` según el formato.

#### 5.6 Settings Pages

Tabs:
1. **Recording** — formats, quality, segment, FFmpeg paths, proxy
2. **Push** — toggles por canal + configuración + test button
3. **Cookies** — input por plataforma + import/export
4. **Accounts** — credenciales por plataforma (Soop, FlexTV, PopkonTV, Twitcasting)
5. **Security** — change password

Todas las settings usan React Query mutations con invalidación optimista.

#### 5.7 About Page

- Version info
- Update checker (manual + estado de `GET /api/updates/check`)
- Links a GitHub / documentación

**Entregables:**
- [x] Todas las páginas implementadas
- [x] Real-time updates vía SSE funcionando (useRealtime en MainLayout)
- [x] Optimistic updates en recording actions
- [x] Batch operations funcionando

---

### Fase 6: Integración y Testing (Semana 5-6)

#### 6.1 API Integration

- Axios interceptor para auth headers
- Axios interceptor para manejo global de errores (401 → redirect login, 5xx → toast)
- Retry logic (axios-retry) para 5xx

```typescript
// services/api.ts
const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

#### 6.2 SSE Integration

- `use-realtime.ts` activo en `(main)/layout.tsx`
- Reconexión automática con backoff exponencial
- Manejo de eventos desconocidos (ignorar gracefully)

#### 6.3 Testing

- E2E básico: login → add recording → start → stop → delete
- Responsive: mobile (375px), tablet (768px), desktop (1280px)
- Browsers: Chrome/Edge, Firefox, Safari

#### 6.4 Error States

- Loading skeletons para todas las listas
- Empty states con call-to-action
- Error boundaries en páginas principales
- Toast notifications via `react-hot-toast`

**Entregables:**
- [ ] App completamente funcional end-to-end (pendiente validación manual con backend activo)
- [ ] Sin regressions en modo desktop Flet (no tocado en esta fase; pendiente validación manual)
- [x] SSE reconnect funcionando
- [ ] Responsive en todos los breakpoints (pendiente validación manual en navegador)

---

### Fase 7: Polish y Deploy (Semana 6-7)

#### 7.1 Performance

- `React.lazy` + `Suspense` para route-level code splitting
- Bundle analysis: `next build --analyze`
- Target: bundle JS < 200KB gzipped inicial
- Lazy load video.js (solo en Storage/Video pages)

#### 7.2 Accessibility

- Keyboard navigation completa (Tab, Esc, Enter)
- Focus indicators visibles en todos los componentes glass
- ARIA labels en iconos sin texto
- Contrast ratio ≥ 4.5:1 en texto (especialmente con glass backgrounds)

#### 7.3 Glassmorphism Polish

- `backdrop-filter` fallback para browsers sin soporte (Firefox parcial)
- `@supports (backdrop-filter: blur())` para degradación graceful
- Performance: limitar `backdrop-filter` a elementos fijos/sticky

#### 7.4 Deploy

**Desarrollo (puertos reales confirmados):**
```bash
# Terminal 1: Python Flet (ya en uso)
python main.py --web --host 0.0.0.0 --port 6006

# Terminal 2: Python FastAPI REST (Fase 3 resultado)
# Se inicia automáticamente desde main.py en thread daemon — puerto 6007

# Terminal 3: Next.js dev
cd frontend && npm run dev  # puerto 3000 por defecto
```

**`.env.local` ya creado en Fase 1:**
```env
NEXT_PUBLIC_API_URL=http://localhost:6007
```

**CORS en FastAPI** debe permitir `http://localhost:3000` en dev.

**Producción:**
```bash
cd frontend && npm run build
npm start  # puerto 3000 o configurar en next.config.ts
# Python backend (API) en puerto 6007
# Python Flet web en puerto 6006 (opcional, si se mantiene)
```

**Entregables:**
- [ ] Build de producción sin errores
- [ ] bundle size dentro de target
- [ ] Accesibilidad verificada
- [ ] Documentación de setup

---

## 8. Consideraciones Técnicas

### 8.1 Video Streaming

- Endpoint existente soporta Range requests, ETag, cache — mantener sin cambios
- El `Content-Type` actual es `video/mp4` para todos los formatos — browser maneja decodificación
- Para FLV/TS que no se reproduzcan en el browser: agregar `flv.js` o `mpegts.js` como fallback
- No cambiar la firma del endpoint: `GET /api/videos?filename=&subfolder=`

### 8.2 File Paths Windows/Linux

- El backend ya maneja paths de ambos OS con `pathlib.Path`
- El frontend nunca construye paths de archivo — siempre usa los paths devueltos por el backend
- `storage/browse` devuelve paths relativos a `VIDEO_DIR`, no absolutos

### 8.3 AuthManager Sessions

- Reemplazar `dict` plano por `TTLCache(maxsize=100, ttl=86400)` (24h)
- Agregar `login_at: datetime` al session dict para auditoría
- No implementar JWT por ahora — TTLCache cubre el caso de uso

### 8.4 Estado de Grabación — Thread Safety

- `GlobalRecordingState.recordings` usa `threading.Lock()` — preservar en refactoring
- Las operaciones de la API deben usar el lock para modificar recordings
- La API es async (FastAPI) pero `RecordingManager` puede ser llamado desde threads Flet — usar `loop.run_in_executor()` para operaciones síncronas si es necesario

### 8.5 Security

- Tokens en `localStorage` vía Zustand persist (aceptable para tool local)
- Para deployments públicos: migrar a HTTP-only cookies con CSRF protection
- Storage endpoints: validar siempre con `resolved_path.relative_to(VIDEO_DIR)`
- SSE auth via query param `?token=` (EventSource limitation)
- CORS: solo `localhost:3000` en dev; configurar origen correcto en prod

### 8.6 Glassmorphism Performance

- `backdrop-filter` tiene costo en GPU — no usar en elementos que se re-renderizan frecuentemente
- El RecordingCard list puede tener 100+ cards — usar `will-change: transform` con cuidado
- Considerar `content-visibility: auto` para listas largas

---

## 9. Estimación de Tiempo

| Fase | Duración | Riesgo |
|------|----------|--------|
| Fase 1: Setup Frontend | 1 semana | Bajo |
| Fase 2: Refactoring Backend | 1-2 semanas | **Alto** |
| Fase 3: Backend API REST | 1-2 semanas | Medio |
| Fase 4: UI Components Base | 1 semana | Bajo |
| Fase 5: Páginas y Features | 2-3 semanas | Medio |
| Fase 6: Integration & Testing | 1 semana | Medio |
| Fase 7: Polish & Deploy | 1 semana | Bajo |
| **Total** | **8-11 semanas** | |

> La Fase 2 (RecordingManager decoupling) es la más riesgosa. Si el refactoring rompe comportamiento edge cases del desktop mode, puede costar más de 2 semanas. Agregar buffer de 1 semana.

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| RecordingManager refactoring rompe desktop mode | Media | Alto | Tests antes de refactoring, bridge adapter, iteración incremental |
| Tailwind v3 → v4 migration mid-project | Baja | Medio | Pinear `tailwindcss@^3.4.x` en package.json |
| Glassmorphism performance en listas largas | Media | Medio | Virtualización de listas (`@tanstack/react-virtual`), progressive enhancement |
| SSE race conditions (estado inconsistente) | Media | Medio | Optimistic updates + invalidación completa en eventos críticos |
| FLV/TS playback en browsers | Alta | Medio | Agregar `mpegts.js` para TS/FLV; documentar limitación de FLV en Safari |
| Scope creep | Alta | Alto | Strict phase gates: no avanzar a siguiente fase sin entregables de la actual |

---

## 11. Criterios de Éxito

### Funcionalidad
- [ ] Todas las features del frontend Flet migradas
- [ ] REST API cubre todos los casos de uso
- [ ] Real-time updates vía SSE funcionales
- [ ] Modo desktop Flet intacto (no regresiones)

### UI/UX
- [ ] Glassmorphism consistente en dark/light mode
- [ ] Responsive: mobile 375px, tablet 768px, desktop 1280px+
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge

### Performance
- [ ] First Contentful Paint < 2s en localhost
- [ ] Bundle JS inicial < 200KB gzipped
- [ ] SSE reconecta automáticamente en desconexión

### Seguridad
- [ ] Path traversal protection en todos los storage endpoints
- [ ] Sessions con TTL
- [ ] CORS configurado correctamente

---

## 12. Archivos del Plan

- `PLAN_MIGRATION_FRONTEND.md` — este documento
- `API_SPEC.md` — especificación detallada de request/response schemas (generar en Fase 3)

---

*Documento: 2026-04-25*
*Versión: 2.1 — Actualizado post Fase 1 con versiones reales y notas de implementación*
