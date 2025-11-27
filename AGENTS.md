# AGENTS.md - ZPWoot WhatsApp API

## Project Overview

ZPWoot is a RESTful WhatsApp API built in Go using the whatsmeow library. It provides multi-session WhatsApp management with PostgreSQL persistence, webhook support, and comprehensive message handling.

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Go | 1.24+ |
| Web Framework | Gin | v1.11.0 |
| WhatsApp Library | whatsmeow | v0.0.0-20251120135021 |
| Database | PostgreSQL | 16 |
| Database Driver | pgx/v5 | v5.7.1 |
| Logging | zerolog | v1.34.0 |
| API Docs | swaggo/swag | v1.16.6 |
| Config | godotenv | v1.5.1 |

## Project Structure

```
zpwoot/
├── cmd/
│   └── zpwoot/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── handler/             # HTTP handlers
│   │   │   ├── session.go       # Session CRUD, connect, QR
│   │   │   ├── message.go       # Send text, image, video, etc.
│   │   │   ├── group.go         # Group management
│   │   │   ├── contact.go       # Contact operations
│   │   │   ├── chat.go          # Chat operations
│   │   │   ├── profile.go       # Profile settings
│   │   │   └── webhook.go       # Webhook CRUD
│   │   └── router/
│   │       └── router.go        # Route definitions + auth middleware
│   ├── config/
│   │   └── config.go            # Environment configuration
│   ├── db/
│   │   ├── postgres.go          # Database connection + migrations
│   │   ├── migrations/          # SQL migration files
│   │   │   ├── 001_create_sessions_table.sql
│   │   │   ├── 002_create_messages_table.sql
│   │   │   └── 003_create_webhooks_table.sql
│   │   └── repository/          # Data access layer
│   │       ├── session.go
│   │       ├── message.go
│   │       └── webhook.go
│   ├── logger/
│   │   └── logger.go            # Zerolog wrapper + Gin middleware
│   ├── model/                   # Domain models
│   │   ├── session.go           # Session, SessionRecord, SessionStatus
│   │   ├── message.go           # Message types and status
│   │   └── webhook.go           # Webhook model
│   └── service/                 # Business logic
│       ├── session.go           # Session lifecycle, auto-reconnect
│       ├── whatsapp.go          # WhatsApp operations
│       ├── webhook.go           # Webhook dispatch
│       └── event.go             # Event handling
├── docs/                        # Swagger generated docs
├── .env                         # Environment variables
├── docker-compose.yml           # PostgreSQL, DBGate, Webhook Tester
├── Dockerfile                   # Container build
├── go.mod                       # Dependencies
└── go.sum
```

## Architecture

### Layers
1. **Handler** - HTTP request/response, validation
2. **Service** - Business logic, orchestration
3. **Repository** - Database operations
4. **Model** - Domain entities

### Data Flow
```
HTTP Request → Router → Handler → Service → Repository → PostgreSQL
                                     ↓
                              WhatsApp (whatsmeow)
```

## Database Schema

### Tables (prefix: zp)

**zpSessions** - WhatsApp session metadata
- `id` (PK), `name`, `deviceJid`, `phone`, `status`, `createdAt`, `updatedAt`

**zpMessages** - Message history
- `id` (PK), `sessionId` (FK), `messageId`, `chatJid`, `senderJid`, `type`, `content`, `mediaUrl`, `direction`, `status`, `timestamp`

**zpWebhooks** - Webhook configurations
- `id` (PK), `sessionId` (FK), `url`, `events[]`, `enabled`, `secret`

### Whatsmeow Tables (auto-managed)
- `whatsmeow_device` - Device credentials
- `whatsmeow_contacts` - Synced contacts
- `whatsmeow_sessions` - E2E encryption sessions
- Other encryption/state tables

## API Endpoints

### Sessions
- `GET /sessions/fetch` - List all sessions
- `POST /sessions/:name/create` - Create session
- `POST /sessions/:name/connect` - Connect (shows QR in terminal)
- `GET /sessions/:name/qr` - Get QR code
- `GET /sessions/:name/info` - Session info
- `POST /sessions/:name/logout` - Logout
- `POST /sessions/:name/restart` - Restart connection
- `DELETE /sessions/:name/delete` - Delete session

### Messages
- `POST /sessions/:name/send/text` - Send text
- `POST /sessions/:name/send/image` - Send image
- `POST /sessions/:name/send/audio` - Send audio
- `POST /sessions/:name/send/video` - Send video
- `POST /sessions/:name/send/document` - Send document
- `POST /sessions/:name/send/sticker` - Send sticker
- `POST /sessions/:name/send/location` - Send location
- `POST /sessions/:name/send/contact` - Send contact card
- `POST /sessions/:name/send/reaction` - Send reaction

### Groups
- `POST /sessions/:name/group/create` - Create group
- `GET /sessions/:name/group/list` - List joined groups
- `GET /sessions/:name/group/:groupId/info` - Group info
- `POST /sessions/:name/group/:groupId/leave` - Leave group
- `GET /sessions/:name/group/:groupId/invite` - Get invite link
- `PUT /sessions/:name/group/name` - Update name
- `PUT /sessions/:name/group/description` - Update description
- `POST /sessions/:name/group/participants/add|remove|promote|demote`
- `POST /sessions/:name/group/join` - Join via invite code

### Contacts
- `POST /sessions/:name/contact/check` - Check if phone is on WhatsApp
- `POST /sessions/:name/contact/info` - Get contact info
- `GET /sessions/:name/contact/list` - List contacts
- `GET /sessions/:name/contact/:phone/avatar` - Get avatar
- `POST /sessions/:name/contact/presence` - Set presence
- `POST /sessions/:name/contact/typing` - Set typing indicator
- `POST /sessions/:name/contact/markread` - Mark messages as read

### Chat
- `POST /sessions/:name/chat/archive` - Archive/unarchive chat
- `POST /sessions/:name/chat/delete` - Delete message
- `POST /sessions/:name/chat/edit` - Edit message

### Profile
- `GET /sessions/:name/profile` - Get own profile
- `PUT /sessions/:name/profile/status` - Set status
- `PUT /sessions/:name/profile/name` - Set push name
- `PUT /sessions/:name/profile/picture` - Set profile picture
- `DELETE /sessions/:name/profile/picture` - Delete profile picture
- `GET /sessions/:name/profile/privacy` - Get privacy settings
- `PUT /sessions/:name/profile/privacy` - Set privacy settings

### Webhooks
- `GET /sessions/:name/webhook` - List webhooks
- `POST /sessions/:name/webhook` - Create webhook
- `PUT /sessions/:name/webhook/:id` - Update webhook
- `DELETE /sessions/:name/webhook/:id` - Delete webhook

## Authentication

All endpoints require API key authentication via header:
```
apikey: YOUR_API_KEY
```

## Configuration

Environment variables (`.env`):
```env
DATABASE_URL=postgres://user:pass@localhost:5432/zpwoot?sslmode=disable
PORT=3000
LOG_LEVEL=info          # debug, info, warn, error
LOG_FORMAT=console      # console, json
API_KEY=your-secret-key
```

## Running

### Development
```bash
# Start dependencies
docker compose up -d

# Run API
go run ./cmd/zpwoot

# Or build and run
go build -o zpwoot ./cmd/zpwoot
./zpwoot
```

### Docker Services
- PostgreSQL: `localhost:5432`
- DBGate (DB UI): `localhost:3001`
- Webhook Tester: `localhost:8080`
- API: `localhost:3000`

## Key Features

1. **Multi-session support** - Multiple WhatsApp accounts simultaneously
2. **Auto-reconnect** - Sessions reconnect automatically on server restart
3. **QR code terminal display** - QR shown in terminal during pairing
4. **Message persistence** - Incoming messages saved to database
5. **Webhooks** - HTTP callbacks for events (message received, session status)
6. **Swagger docs** - API documentation at `/swagger/index.html`

## Coding Conventions

- Use singular package names (model, service, handler)
- Use camelCase with double quotes for PostgreSQL columns
- Table prefix: `zp` (zpSessions, zpMessages, zpWebhooks)
- Repositories return `model.*` types, not `db.*` types
- Services handle business logic, handlers only HTTP
- Use zerolog for all logging
- Context propagation through all layers

## Testing

```bash
# Create session
curl -X POST -H "apikey: KEY" http://localhost:3000/sessions/test/create

# Connect and scan QR
curl -X POST -H "apikey: KEY" http://localhost:3000/sessions/test/connect

# Send message
curl -X POST -H "apikey: KEY" -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","message":"Hello!"}' \
  http://localhost:3000/sessions/test/send/text
```

## Webhook Events

- `session.connected` - Session connected
- `session.disconnected` - Session disconnected
- `session.logged_out` - Session logged out
- `message.received` - Message received

Webhook payload:
```json
{
  "event": "message.received",
  "sessionId": 1,
  "timestamp": 1732723200,
  "data": {
    "messageId": "ABC123",
    "chatJid": "5511999999999@s.whatsapp.net",
    "senderJid": "5511888888888@s.whatsapp.net",
    "type": "text",
    "content": "Hello!",
    "timestamp": "2024-11-27T15:00:00Z"
  }
}
```

## Dependencies Graph

```
main.go
  ├── config.Load()
  ├── logger.Init()
  ├── db.New() → PostgreSQL + whatsmeow sqlstore
  │     ├── Sessions (repository)
  │     ├── Messages (repository)
  │     └── Webhooks (repository)
  ├── service.NewWebhookService()
  ├── service.NewSessionService() → manages whatsmeow clients
  ├── service.NewWhatsAppService()
  └── router.Setup() → Gin + handlers
```
