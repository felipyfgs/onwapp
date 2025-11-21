# Implementation Plan - WhatsApp API (NestJS)

## Goal Description
Build a WhatsApp API using NestJS, inspired by `whaileys`. The core focus is on managing WhatsApp sessions via a REST API.

## User Review Required
- [ ] Confirm usage of `@whiskeysockets/baileys` as the underlying WhatsApp library (standard Node.js choice).
- [ ] Review the API route structure.

## Proposed Changes

### Dependencies
- Install `whaileys` (fork of Baileys) for WhatsApp connectivity.
- Install `qrcode` for QR code generation.

### Modules

#### Sessions Module (`/sessions`)
Implement `SessionsController` and `SessionsService` to handle:
- **Auth**: Global Guard/Middleware for authentication.
- **Routes**:
    - `GET /sessions/webhook/events` - List supported webhook events.
    - `POST /sessions/create` - Create a new session.
    - `GET /sessions/list` - List all sessions.
    - `GET /sessions/:id/info` - Get session details.
    - `DELETE /sessions/:id/delete` - Delete a session.
    - `POST /sessions/:id/connect` - Connect a session.
    - `POST /sessions/:id/disconnect` - Disconnect a session.
    - `GET /sessions/:id/qr` - Get current QR Code.
    - `POST /sessions/:id/pair` - Pair with phone code.
    - `GET /sessions/:id/status` - Get session status.
    - `POST /sessions/:id/logout` - Logout session.

### Database
- Store session data/creds using Prisma (Postgres).
- Define `Session` model in `schema.prisma`.

## Verification Plan
### Manual Verification
- Start app: `npm run start:dev`.
- Test each endpoint using curl or Postman.
- Verify WhatsApp connection (QR scan/Pairing).

