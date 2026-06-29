# API Versioning Policy & Changelog

## Versioning Strategy

Academix uses a global API versioning strategy embedded directly in the route prefix (`/api/v1/`).
- **Major versions (`v1`, `v2`)** are bumped for backwards-incompatible breaking changes (e.g., removing endpoints, changing required request payloads, renaming response keys).
- **Minor versions (1.1, 1.2)** are internal and invisible to the URL structure. They represent backwards-compatible additions (e.g., new endpoints, optional parameters, new non-breaking response fields).

The current active version is **v1** (Internal revision: 1.2).

## Deprecation Policy
If a `v2` is introduced, `v1` endpoints will remain active and supported for **6 months** before sunsetting. Clients will receive an `X-API-Deprecation-Date` header on older endpoints once a deprecation period begins.

---

## Changelog

### [v1.2] - 2026-06-29
**Security & Reliability Refactor**
- **Changed:** Transitioned authentication from `localStorage` JWTs to strict `HttpOnly`, `Secure`, `SameSite=None` cookies to mitigate XSS vulnerabilities while supporting cross-origin Vercel/Render deployments.
- **Changed:** Deprecated `get_supabase()` in favor of `get_supabase_admin()` for clarity around Service Role key bypass, paving the way for proper RLS integration.
- **Added:** Silent `/api/v1/auth/refresh` endpoint to hydrate React context securely on initialization.
- **Changed:** Refactored `WebSocket` endpoint `/ws` to accept `?token=` query parameters instead of awaiting the token post-connection to prevent race conditions.
- **Changed:** Rebuilt `/api/v1/attendance` logic to serve as the absolute single source of truth for math calculations (`math.ceil`/`math.floor`).

### [v1.1] - 2026-06-25
**Feature Expansion**
- **Added:** Intelligent Risk Engine scoring to `/api/v1/dashboard`.
- **Added:** Integration tests for task creation and vector database verification.
- **Added:** Google Calendar integration OAuth endpoints (`/api/v1/auth/google/connect` and `/api/v1/auth/google/callback`).

### [v1.0] - 2026-06-20
**Initial Release**
- **Added:** Core REST endpoints for tasks, dashboard, auth, attendance, and automations.
- **Added:** Webhooks for Telegram bot integration.
- **Added:** Conversational AI inbox powered by Groq/Gemini via `/api/v1/intelligence`.
