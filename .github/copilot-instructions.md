# zpwoot - WhatsApp API Service

## Architecture Overview

zpwoot is a **NestJS-based WhatsApp API service** that wraps the `whaileys` library (WhatsApp Web multi-device protocol) to provide a RESTful API for managing WhatsApp sessions. Core architecture:

- **Session Management Layer** (`src/modules/session/`): Handles WhatsApp session lifecycle (create, connect, disconnect, QR codes)
- **WhatsApp Service Layer** (`src/whats/`): Direct interface to `whaileys` library, manages WebSocket connections and event handling
- **Database-Backed Auth** (`src/whats/database-auth-state.ts`): WhatsApp credentials stored in PostgreSQL via Prisma (NOT file-based)
- **Message Layer** (`src/modules/message/`): Stub for sending/receiving messages (minimal implementation)
- **API Security**: All endpoints protected by `ApiKeyGuard` requiring `GLOBAL_API_KEY` via `X-API-Key` header or `Authorization: Bearer` token

## Critical Dependencies

- **whaileys** (v6.4.2): WhatsApp Web protocol implementation - imported using `require()` pattern for CJS compatibility
- **Prisma** (v7.0.0): Database ORM - manages `Session` model with JSON `creds` field for WhatsApp auth state
- **NestJS** (v11): Framework - uses dependency injection for PrismaService, WhatsService, SessionService

## Database Schema

The `Session` model (`prisma/schema.prisma`) stores:
- `id` (UUID), `name` (unique identifier), `status` (disconnected/connecting/open)
- `creds` (JSON): WhatsApp authentication state (credentials + keys) - updated via `DatabaseAuthState`
- `qrCode` (string): Current QR code for pairing
- `phoneNumber`: Associated phone after pairing
- `webhookUrl`, `webhookEvents[]`: Webhook configuration (not fully implemented)

## Development Workflow

### Setup & Running
```bash
# Start PostgreSQL via Docker
docker compose up -d

# Install dependencies
npm install

# Set environment variables (copy .env.example to .env)
DATABASE_URL="postgresql://zpwoot:zpwoot123@localhost:5432/zpwoot"
GLOBAL_API_KEY="your-secret-api-key-here"

# Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev

# Development mode (watch + auto-reload)
npm run start:dev

# Production
npm run build && npm run start:prod
```

### Testing
- No tests currently implemented (test files exist but are stubs)
- Manual testing via REST endpoints at `http://localhost:3000`

## Key Patterns & Conventions

### WhatsApp Connection Lifecycle
1. **Create Session**: `POST /sessions/create` → Stores in DB with `status: "disconnected"`
2. **Connect**: `POST /sessions/:id/connect` → Initializes `whaileys` socket, generates QR code
3. **QR Code Retrieval**: `GET /sessions/:id/qr` → Returns QR for mobile scanning
4. **Connection Events**: `whaileys` emits `connection.update` → Updates `status` in DB (`connecting` → `open`)
5. **Auto-Reconnect**: On disconnect, reconnects automatically unless `DisconnectReason.loggedOut`

### Authentication State Pattern
WhatsApp credentials are **NOT stored in files** - they use `DatabaseAuthState` class:
- `getState()`: Retrieves `creds` JSON from Prisma
- `saveCreds()`: Updates `creds` field when `creds.update` event fires
- Wrapped in `useDatabaseAuthState()` factory function compatible with `whaileys`

### In-Memory Session Management
`WhatsService` maintains three Maps:
- `sessions: Map<string, WASocket>` - Active WhatsApp socket connections
- `qrCodes: Map<string, string>` - Current QR codes per session
- `connectionStatus: Map<string, string>` - Connection states (synced to DB periodically)

**Important**: Sessions are lost on restart - DB only persists auth credentials, not runtime state.

### API Security Pattern
All controllers use `@UseGuards(ApiKeyGuard)`:
```typescript
// Extract from request headers:
// X-API-Key: <your-key>
// OR Authorization: Bearer <your-key>
```
Compared against `process.env.GLOBAL_API_KEY` - throws `UnauthorizedException` if missing/invalid.

### DTO Validation
Uses `class-validator` + `ValidationPipe`:
- DTOs in `src/modules/*/dto/` directories
- Applied via `@Body(ValidationPipe)` in controllers
- Exports centralized through `dto/index.ts` barrel files

### Module Organization
Each feature module follows NestJS standard:
```
modules/<feature>/
  ├── <feature>.module.ts    # Imports providers, controllers
  ├── <feature>.controller.ts # REST endpoints
  ├── <feature>.service.ts    # Business logic
  └── dto/
      ├── index.ts            # Barrel exports
      └── *.dto.ts            # Request/response DTOs
```

## Path Aliasing
Uses `@/` alias for `src/` directory (configured in `tsconfig.json`):
```typescript
import { PrismaService } from '@/prisma/prisma.service';
import { WhatsService } from '@/whats/whats.service';
```

## Known Limitations & TODOs

- **Phone Pairing**: `POST /sessions/:id/pair` is stubbed - `whaileys` pairing implementation unclear
- **Message Processing**: `handleIncomingMessages()` in `WhatsService` only logs - no DB storage or webhook triggering
- **Webhook Events**: Listed in `listWebhookEvents()` but not implemented - no actual webhook dispatching
- **Message Module**: `MessageService` and controller are mostly empty stubs
- **No Horizontal Scaling**: In-memory Maps prevent multi-instance deployments - requires Redis or similar

## Code Style Notes

- ESLint config uses flat config format (`eslint.config.mjs`)
- Prettier formatting: `npm run format`
- Logger pattern: Use `Logger` from `@nestjs/common` with class name context
- Error handling: Throw NestJS exceptions (`NotFoundException`, `BadRequestException`) - framework handles HTTP responses
- Async/await preferred over promises - all service methods are async

## Common Pitfalls

1. **WhatsApp auth state corruption**: If `creds` JSON becomes invalid, must call `POST /sessions/:id/logout` to clear and re-authenticate
2. **Session ID vs Name**: API uses UUID `id` (not `name`) for most endpoints - name is only used for creation/uniqueness
3. **QR Code timing**: QR expires quickly - must call `/sessions/:id/qr` immediately after `/sessions/:id/connect`
4. **Env var required**: Application crashes if `GLOBAL_API_KEY` not set - guard checks on every request
