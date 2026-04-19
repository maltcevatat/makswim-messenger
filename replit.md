# MAKSWIM Messenger — Workspace

## Overview

pnpm workspace monorepo. Internal messenger for MAKSWIM Triathlon Team.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **Build**: esbuild (no tsc in build pipeline; use tsc for type checks only)
- **Frontend**: React + Vite + Tailwind CSS (artifact: `messenger`)
- **Backend**: Express + TypeScript (artifact: `api-server`)

## Artifacts

- `artifacts/messenger` — React frontend, preview path `/messenger/`
- `artifacts/api-server` — Express API, runs on PORT 8080

## Key Architecture

### Auth
- Invite-code based, no passwords
- HttpOnly cookie `makswim_session` (30-day session)
- `POST /api/auth/validate-code` — check code status (new/returning, expiry, revocation)
- `POST /api/auth/setup-profile` — register or login
- `GET /api/auth/me` — get current user
- Codes can be revoked (`is_revoked`), have expiry (`expires_at`)

### Role separation
- Two roles: `admin` | `user`
- Backend: `requireAdmin` middleware on all admin routes
- Frontend: `AuthGuard adminOnly` on `/admin` and `/members` routes
- BottomNav only shows Participants + Admin tabs to admins

### Real-time messaging
- SSE endpoint: `GET /api/chats/:chatId/stream` (Server-Sent Events)
- Client connects with EventSource, falls back to 2s polling on error
- Optimistic UI: messages appear immediately with `sending` status
- Idempotent sends via `clientMessageId` (UUID) — prevents duplicates on retry
- Message statuses: `sending` (spinner) | `sent` (checkmark) | `error` (retry button)

### Media
- Images: compressed client-side (Canvas API, max 1024px, JPEG 80%), stored as base64 in DB
- Voice: `MediaRecorder` → pre-listen preview (audio player + cancel/send) → base64 in DB
- File size limit: 15MB before compression

### Chat types
- Personal chats: deterministic ID via SHA1 hash of two user IDs
- Group chats: stored in `chats` table, managed by admins only

### Pagination
- Messages endpoint: `?limit=N&before=<ISO timestamp>` for older messages
- Frontend shows "Load older" button when more messages exist

### Invite codes
- Admin can generate codes with custom expiry (days) and role (admin/user)
- Codes can be revoked: invalidates code + terminates user sessions
- Expiry displayed in admin panel; expired codes shown clearly

### Drafts
- Auto-saved to localStorage per chat (`makswim_draft:{chatId}`)
- Restored on next visit to same chat

### Offline
- `navigator.onLine` + window events
- Red banner shown when offline; sending disabled

## Key Commands

- `pnpm --filter @workspace/db run push` — apply schema changes to DB (safe additive only)
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/messenger run dev` — run frontend

## Database Schema (lib/db/src/schema/index.ts)

Tables: `users`, `invite_codes`, `sessions`, `chats`, `chat_members`, `messages`, `training_events`, `training_registrations`, `push_subscriptions`

Key additions (safe additive):
- `messages.client_message_id` — unique, for idempotent sends
- `invite_codes.expires_at` — optional expiry timestamp
- `invite_codes.is_revoked` — revocation flag (bool, default false)
- `invite_codes.revoked_at` — revocation timestamp
