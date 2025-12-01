<coding_guidelines>
# AGENTS.md - ZPWoot WhatsApp API

## Project Overview

ZPWoot is a comprehensive RESTful WhatsApp API built in Go using the whatsmeow library. It provides multi-session WhatsApp management with PostgreSQL persistence, webhook support, Chatwoot integration, MinIO/S3 media storage, and full message handling capabilities including interactive messages, newsletters, communities, and stories.

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Go | 1.24+ |
| Web Framework | Gin | v1.11.0 |
| WhatsApp Library | whatsmeow | v0.0.0-20251128 (fork) |
| Database | PostgreSQL | 16 |
| Database Driver | pgx/v5 | v5.7.1 |
| Object Storage | MinIO/S3 | v7.0.97 |
| Logging | zerolog | v1.34.0 |
| API Docs | swaggo/swag | v1.16.6 |
| Config | godotenv | v1.5.1 |
| QR Code | mdp/qrterminal, skip2/go-qrcode | v3.2.1 |

## Project Structure

```
zpwoot/
├── cmd/
│   └── zpwoot/
│       └── main.go                    # Application entry point
├── internal/
│   ├── api/
│   │   ├── dto/                       # Data Transfer Objects
│   │   │   ├── base.go                # Base request/response types
│   │   │   ├── group.go               # Group-specific DTOs
│   │   │   ├── message.go             # Message DTOs
│   │   │   ├── request.go             # Request DTOs
│   │   │   ├── response.go            # Response DTOs
│   │   │   └── session.go             # Session DTOs
│   │   ├── handler/                   # HTTP handlers
│   │   │   ├── call.go                # Call handling
│   │   │   ├── chat.go                # Chat operations
│   │   │   ├── community.go           # Community management
│   │   │   ├── contact.go             # Contact operations
│   │   │   ├── group.go               # Group management
│   │   │   ├── helpers.go             # Handler utilities
│   │   │   ├── media.go               # Media management
│   │   │   ├── message.go             # Send text, image, video, etc.
│   │   │   ├── newsletter.go          # Newsletter/Channel operations
│   │   │   ├── profile.go             # Profile settings
│   │   │   ├── session.go             # Session CRUD, connect, QR
│   │   │   └── status.go              # Stories/Status operations
│   │   ├── middleware/
│   │   │   └── middleware.go          # Auth, CORS, RateLimit
│   │   └── router/
│   │       └── router.go              # Route definitions
│   ├── config/
│   │   └── config.go                  # Environment configuration
│   ├── db/
│   │   ├── postgres.go                # Database connection + migrations
│   │   ├── migrations/                # SQL migration files (15 files)
│   │   │   ├── 001_extensions.sql     # PostgreSQL extensions
│   │   │   ├── 002_sessions.sql       # Sessions table
│   │   │   ├── 003_messages.sql       # Messages table
│   │   │   ├── 004_webhooks.sql       # Webhooks table
│   │   │   ├── 005_message_updates.sql # Message updates table
│   │   │   ├── 006_chatwoot.sql       # Chatwoot integration tables
│   │   │   ├── 007_media.sql          # Media storage table
│   │   │   ├── 008_chats.sql          # Extended chat metadata
│   │   │   ├── 009_past_participants.sql # Group past participants
│   │   │   ├── 010_stickers.sql       # Stickers table
│   │   │   ├── 011_history_sync_progress.sql # Sync progress tracking
│   │   │   ├── 012_relationships.sql  # Foreign key relationships
│   │   │   ├── 013_indexes.sql        # Performance indexes
│   │   │   ├── 014_views.sql          # Database views
│   │   │   └── 015_functions.sql      # Database functions
│   │   └── repository/                # Data access layer
│   │       ├── chat.go                # Chat repository
│   │       ├── contact.go             # Contact repository
│   │       ├── history_sync.go        # History sync repository
│   │       ├── media.go               # Media repository
│   │       ├── message.go             # Message repository
│   │       ├── message_update.go      # Message update repository
│   │       ├── session.go             # Session repository
│   │       └── sticker.go             # Sticker repository
│   ├── integrations/
│   │   ├── chatwoot/                  # Chatwoot CRM integration
│   │   │   ├── chatwoot.go            # Main integration module
│   │   │   ├── client/                # Chatwoot API client
│   │   │   │   ├── client.go          # HTTP client
│   │   │   │   └── uploader.go        # Media upload handling
│   │   │   ├── core/                  # Core types
│   │   │   │   ├── constants.go       # Constants and enums
│   │   │   │   ├── errors.go          # Error definitions
│   │   │   │   └── model.go           # Chatwoot models
│   │   │   ├── handler/               # HTTP handlers
│   │   │   │   ├── dto.go             # Request/response DTOs
│   │   │   │   ├── handler.go         # Webhook handler
│   │   │   │   └── router.go          # Route setup
│   │   │   ├── repository/            # Data access
│   │   │   │   ├── chatwoot_db.go     # Direct Chatwoot DB access
│   │   │   │   └── config.go          # Config repository
│   │   │   ├── service/               # Business logic
│   │   │   │   ├── bot.go             # Bot message handling
│   │   │   │   ├── contacts.go        # Contact management
│   │   │   │   ├── events.go          # Event processing
│   │   │   │   ├── messages.go        # Message handling
│   │   │   │   ├── service.go         # Main service
│   │   │   │   └── webhook.go         # Webhook processing
│   │   │   ├── sync/                  # Sync operations
│   │   │   │   ├── avatar.go          # Avatar sync
│   │   │   │   ├── contacts.go        # Contact sync
│   │   │   │   ├── content.go         # Content formatting
│   │   │   │   ├── errors.go          # Sync errors
│   │   │   │   ├── messages.go        # Message sync
│   │   │   │   ├── repository.go      # Sync repository
│   │   │   │   ├── reset.go           # Reset operations
│   │   │   │   ├── status.go          # Status sync
│   │   │   │   └── sync.go            # Main sync logic
│   │   │   └── util/                  # Utilities
│   │   └── webhook/                   # Webhook integration
│   │       ├── handler.go             # Webhook HTTP handlers
│   │       ├── model.go               # Webhook models
│   │       ├── repository.go          # Webhook repository
│   │       ├── router.go              # Webhook routes
│   │       └── service.go             # Webhook service
│   ├── logger/
│   │   └── logger.go                  # Zerolog wrapper + Gin middleware
│   ├── model/                         # Domain models
│   │   ├── chat.go                    # Chat model
│   │   ├── event.go                   # Event types (60+ events)
│   │   ├── history_sync.go            # History sync progress model
│   │   ├── media.go                   # Media model
│   │   ├── message.go                 # Message types and status
│   │   ├── message_update.go          # Message delivery/read updates
│   │   ├── session.go                 # Session, SessionRecord, SessionStatus
│   │   └── sticker.go                 # Sticker model
│   ├── service/                       # Business logic
│   │   ├── event.go                   # Event handling
│   │   ├── history_sync.go            # History sync service
│   │   ├── media.go                   # Media processing service
│   │   ├── session.go                 # Session lifecycle, auto-reconnect
│   │   ├── storage.go                 # MinIO/S3 storage service
│   │   └── whatsapp.go                # WhatsApp operations
│   └── util/                          # Utility functions
│       └── jid.go                     # JID parsing utilities
├── scripts/                           # Utility scripts
│   ├── reset_chatwoot.sh              # Reset Chatwoot data
│   └── reset_chatwoot.sql             # SQL for Chatwoot reset
├── docs/                              # Swagger generated docs
├── .env                               # Environment variables
├── docker-compose.yml                 # PostgreSQL, DBGate, Webhook Tester, MinIO
├── Dockerfile                         # Container build
├── Makefile                           # Build and dev commands
├── chatwoot-config.json               # Chatwoot configuration
├── go.mod                             # Dependencies
└── go.sum
```

## Architecture

### Layers
1. **Handler** - HTTP request/response, validation
2. **Service** - Business logic, orchestration
3. **Repository** - Database operations
4. **Model** - Domain entities
5. **DTO** - Data Transfer Objects (request/response)
6. **Integrations** - External service integrations (Chatwoot)

### Data Flow
```
HTTP Request → Router → Middleware → Handler → Service → Repository → PostgreSQL
                                        ↓
                                  WhatsApp (whatsmeow)
                                        ↓
                                  Integrations (Chatwoot)
```

## Database Schema

### Tables (prefix: zp)

**zpSessions** - WhatsApp session metadata
- `id` (PK), `name`, `deviceJid`, `phone`, `status`, `createdAt`, `updatedAt`

**zpMessages** - Message history with full metadata
- `id` (PK), `sessionId`, `messageId`, `chatJid`, `senderJid`, `pushName`
- `type`, `mediaType`, `category`, `content`
- `isFromMe`, `isGroup`, `isEphemeral`, `isViewOnce`, `isEdit`
- `quotedId`, `quotedSender`, `editTargetId`
- `chatwootMessageId`, `chatwootConversationId`, `chatwootSourceId`
- `status`, `deliveredAt`, `readAt`
- `reactions`, `rawEvent`, `timestamp`, `createdAt`

**zpMessageUpdates** - Delivery status tracking
- `id` (PK), `sessionId`, `messageId`, `chatJid`, `senderJid`
- `updateType`, `status`, `timestamp`
- Chatwoot integration fields

**zpWebhooks** - Webhook configurations
- `id` (PK), `sessionId` (FK), `url`, `events[]`, `enabled`, `secret`

**zpMedia** - Media files storage
- `id` (PK), `sessionId` (FK), `msgId`
- `mediaType`, `mimeType`, `fileSize`, `fileName`
- `waDirectPath`, `waMediaKey`, `waFileSHA256`, `waFileEncSHA256`
- `width`, `height`, `duration`
- `storageKey`, `storageUrl`, `storedAt`
- `thumbnailKey`, `thumbnailUrl`
- `downloaded`, `downloadError`, `downloadAttempts`

**zpChats** - Extended chat metadata from History Sync
- `id` (PK), `sessionId` (FK), `chatJid`, `name`
- `unreadCount`, `unreadMentionCount`, `markedAsUnread`
- `ephemeralExpiration`, `ephemeralSettingTimestamp`, `disappearingInitiator`
- `readOnly`, `suspended`, `locked`
- `limitSharing`, `limitSharingTimestamp`, `limitSharingTrigger`
- `isDefaultSubgroup`, `commentsCount`
- `conversationTimestamp`, `pHash`, `notSpam`

**zpStickers** - Frequently used stickers from History Sync
- `id` (PK), `sessionId` (FK)
- `waFileSHA256`, `waFileEncSHA256`, `waMediaKey`, `waDirectPath`
- `mimeType`, `fileSize`, `width`, `height`
- `weight`, `lastUsedAt`
- `isLottie`, `isAvatar`
- `storageKey`, `storageUrl`
- `downloaded`, `downloadError`, `downloadAttempts`

**zpPastParticipants** - Group past participants history

**zpHistorySyncProgress** - History sync progress tracking

### Whatsmeow Tables (auto-managed)
- `whatsmeow_device` - Device credentials
- `whatsmeow_contacts` - Synced contacts
- `whatsmeow_sessions` - E2E encryption sessions
- Other encryption/state tables

## API Endpoints

### Health & Documentation
- `GET /health` - Health check with database status
- `GET /swagger/*any` - Swagger documentation
- `GET /events` - List all available webhook events

### Sessions
- `GET /sessions` - List all sessions
- `POST /sessions` - Create session
- `GET /sessions/:id` - Session info
- `DELETE /sessions/:id` - Delete session
- `POST /sessions/:id/connect` - Connect (shows QR in terminal)
- `POST /sessions/:id/logout` - Logout
- `POST /sessions/:id/restart` - Restart connection
- `GET /sessions/:id/qr` - Get QR code
- `POST /sessions/:id/pair/phone` - Pair via phone number
- `GET /sessions/:id/qrlink` - Get QR link

### Messages
- `POST /sessions/:id/messages/text` - Send text
- `POST /sessions/:id/messages/image` - Send image
- `POST /sessions/:id/messages/audio` - Send audio (PTT support)
- `POST /sessions/:id/messages/video` - Send video
- `POST /sessions/:id/messages/document` - Send document
- `POST /sessions/:id/messages/sticker` - Send sticker
- `POST /sessions/:id/messages/location` - Send location
- `POST /sessions/:id/messages/contact` - Send contact card
- `POST /sessions/:id/messages/reaction` - Send reaction
- `POST /sessions/:id/messages/poll` - Send poll
- `POST /sessions/:id/messages/poll/vote` - Vote on poll
- `POST /sessions/:id/messages/buttons` - Send buttons
- `POST /sessions/:id/messages/list` - Send list message
- `POST /sessions/:id/messages/interactive` - Send interactive message
- `POST /sessions/:id/messages/template` - Send template message
- `POST /sessions/:id/messages/carousel` - Send carousel message

### Groups
- `POST /sessions/:id/groups` - Create group
- `GET /sessions/:id/groups` - List joined groups
- `GET /sessions/:id/groups/:groupId` - Group info
- `DELETE /sessions/:id/groups/:groupId/membership` - Leave group
- `GET /sessions/:id/groups/:groupId/invite` - Get invite link
- `PATCH /sessions/:id/groups/:groupId/name` - Update name
- `PATCH /sessions/:id/groups/:groupId/description` - Update description
- `POST /sessions/:id/groups/:groupId/participants` - Add participants
- `DELETE /sessions/:id/groups/:groupId/participants` - Remove participants
- `PATCH /sessions/:id/groups/:groupId/participants/promote` - Promote to admin
- `PATCH /sessions/:id/groups/:groupId/participants/demote` - Demote admin
- `POST /sessions/:id/groups/join` - Join via invite code
- `POST /sessions/:id/groups/:groupId/messages` - Send group message
- `PATCH /sessions/:id/groups/:groupId/settings/announce` - Set announce mode
- `PATCH /sessions/:id/groups/:groupId/settings/locked` - Set locked mode
- `PUT /sessions/:id/groups/:groupId/picture` - Set group picture
- `PATCH /sessions/:id/groups/:groupId/settings/approval` - Set approval mode
- `PATCH /sessions/:id/groups/:groupId/settings/memberadd` - Set member add mode
- `GET /sessions/:id/groups/:groupId/requests` - Get join requests
- `POST /sessions/:id/groups/:groupId/requests` - Approve/reject requests
- `GET /sessions/:id/groups/info/link` - Get group info from link

### Contacts
- `GET /sessions/:id/contacts` - List contacts
- `POST /sessions/:id/contacts/check` - Check if phones are on WhatsApp
- `GET /sessions/:id/contacts/:phone` - Get contact info
- `GET /sessions/:id/contacts/:phone/avatar` - Get avatar
- `GET /sessions/:id/contacts/:phone/business` - Get business profile
- `GET /sessions/:id/contacts/blocklist` - Get blocklist
- `PUT /sessions/:id/contacts/blocklist` - Block/unblock contact
- `POST /sessions/:id/contacts/:phone/presence/subscribe` - Subscribe to presence

### Chats
- `PUT /sessions/:id/presence` - Set online/offline presence
- `POST /sessions/:id/chats/:chatId/typing` - Set typing indicator
- `POST /sessions/:id/chats/:chatId/read` - Mark messages as read
- `PATCH /sessions/:id/chats/:chatId/archive` - Archive/unarchive chat
- `DELETE /sessions/:id/chats/:chatId/messages/:messageId` - Delete message
- `PATCH /sessions/:id/chats/:chatId/messages/:messageId` - Edit message
- `PATCH /sessions/:id/chats/:chatId/settings/disappearing` - Set disappearing timer

### Profile
- `GET /sessions/:id/profile` - Get own profile
- `PATCH /sessions/:id/profile/status` - Set status text
- `PATCH /sessions/:id/profile/name` - Set push name
- `PUT /sessions/:id/profile/picture` - Set profile picture
- `DELETE /sessions/:id/profile/picture` - Delete profile picture
- `GET /sessions/:id/profile/privacy` - Get privacy settings
- `PUT /sessions/:id/profile/privacy` - Set privacy settings
- `PATCH /sessions/:id/profile/disappearing` - Set default disappearing timer

### Webhooks
- `GET /sessions/:id/webhooks` - Get webhook config
- `POST /sessions/:id/webhooks` - Set webhook config

### Newsletters (Channels)
- `POST /sessions/:id/newsletters` - Create newsletter
- `GET /sessions/:id/newsletters` - List subscribed newsletters
- `GET /sessions/:id/newsletters/:newsletterId` - Get newsletter info
- `POST /sessions/:id/newsletters/:newsletterId/follow` - Follow newsletter
- `DELETE /sessions/:id/newsletters/:newsletterId/follow` - Unfollow newsletter
- `GET /sessions/:id/newsletters/:newsletterId/messages` - Get messages
- `POST /sessions/:id/newsletters/:newsletterId/reactions` - Send reaction
- `PATCH /sessions/:id/newsletters/:newsletterId/mute` - Toggle mute

### Stories/Status
- `POST /sessions/:id/stories` - Send story/status
- `GET /sessions/:id/stories/privacy` - Get status privacy settings

### Calls
- `POST /sessions/:id/calls/reject` - Reject incoming call

### Communities
- `POST /sessions/:id/communities/:communityId/groups` - Link group to community
- `DELETE /sessions/:id/communities/:communityId/groups/:groupId` - Unlink group
- `GET /sessions/:id/communities/:communityId/groups` - Get community subgroups

### Media
- `GET /sessions/:id/media` - List media files
- `GET /sessions/:id/media/pending` - List pending media (not downloaded)
- `POST /sessions/:id/media/process` - Process/download pending media
- `GET /sessions/:id/media/:msgId` - Get specific media file

## Authentication

All endpoints (except /health and /swagger) require API key authentication via header:
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
SERVER_URL=http://localhost:3000  # Optional, auto-detected

# MinIO/S3 Configuration (media storage)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=zpwoot
MINIO_SECRET_KEY=zpwoot123
MINIO_BUCKET=zpwoot-media
MINIO_USE_SSL=false

# Debug Options
DEBUG_HISTORY_SYNC=false  # Enable detailed history sync logging
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
- MinIO (S3): `localhost:9000` (Console: `localhost:9001`)
- API: `localhost:3000`

## Key Features

1. **Multi-session support** - Multiple WhatsApp accounts simultaneously
2. **Auto-reconnect** - Sessions reconnect automatically on server restart
3. **QR code display** - QR shown in terminal and available via API
4. **Phone pairing** - Alternative pairing via phone number
5. **Message persistence** - Full message history with delivery tracking
6. **Interactive messages** - Buttons, lists, templates, carousels
7. **Newsletter support** - Create and manage WhatsApp channels
8. **Story/Status** - Post status updates
9. **Community management** - Link/unlink groups to communities
10. **Chatwoot integration** - Full CRM integration with bidirectional sync
11. **Webhooks** - HTTP callbacks for 60+ event types
12. **Swagger docs** - API documentation at `/swagger/index.html`
13. **Rate limiting** - Configurable request rate limiting
14. **CORS support** - Configurable cross-origin settings
15. **MinIO/S3 storage** - Media files storage with automatic download
16. **History sync** - Full conversation history synchronization
17. **Sticker management** - Frequently used stickers from sync
18. **Extended chat metadata** - Ephemeral settings, unread counts, privacy

## Webhook Events (60+ events)

### Session Events
- `session.connected`, `session.disconnected`, `session.logged_out`
- `session.qr`, `session.connect_failure`, `session.stream_replaced`
- `session.stream_error`, `session.temporary_ban`, `session.client_outdated`
- `session.keepalive_timeout`, `session.keepalive_restored`
- `session.pair_success`, `session.pair_error`

### Message Events
- `message.received`, `message.sent`, `message.receipt`
- `message.reaction`, `message.deleted`, `message.edited`
- `message.undecryptable`, `message.media_retry`

### Presence Events
- `presence.update`, `chat.presence`

### Sync Events
- `history.sync`, `sync.offline_preview`, `sync.offline_completed`
- `sync.app_state`, `sync.app_state_complete`

### Contact Events
- `contact.push_name`, `contact.picture`, `contact.update`
- `contact.business_name`, `contact.about`

### Call Events
- `call.offer`, `call.offer_notice`, `call.accept`, `call.pre_accept`
- `call.reject`, `call.terminate`, `call.transport`, `call.relay_latency`

### Group Events
- `group.update`, `group.joined`, `group.participants`

### Privacy Events
- `privacy.settings`, `privacy.identity_change`, `privacy.blocklist`

### Newsletter Events
- `newsletter.join`, `newsletter.leave`, `newsletter.mute_change`
- `newsletter.live_update`

### Chat Management Events
- `chat.archive`, `chat.pin`, `chat.mute`, `chat.star`
- `chat.delete_for_me`, `chat.delete`, `chat.clear`, `chat.mark_as_read`
- `chat.label_edit`, `chat.label_association`

### Wildcard
- `*` - Subscribe to all events

## Webhook Payload Example

```json
{
  "event": "message.received",
  "sessionId": "default",
  "timestamp": 1732723200,
  "data": {
    "id": "uuid",
    "messageId": "ABC123",
    "chatJid": "5511999999999@s.whatsapp.net",
    "senderJid": "5511888888888@s.whatsapp.net",
    "pushName": "John Doe",
    "type": "text",
    "content": "Hello!",
    "isFromMe": false,
    "isGroup": false,
    "timestamp": "2024-11-27T15:00:00Z"
  }
}
```

## Chatwoot Integration

Full bidirectional integration with Chatwoot CRM:

### Features
- Auto-create contacts and conversations
- Message sync (WhatsApp ↔ Chatwoot)
- Delivery/read receipt sync
- Media attachment support (images, video, audio, documents)
- Brazilian phone number normalization (9-digit merge)
- Configurable agent signature on messages
- Conversation status management (pending, open, resolved)
- Avatar sync from WhatsApp to Chatwoot
- Direct Chatwoot database integration for advanced operations
- Bot message handling
- Reset/cleanup operations

### Configuration (chatwoot-config.json)
```json
{
  "enabled": true,
  "url": "https://chatwoot.example.com",
  "token": "api-access-token",
  "account": 1,
  "inbox": "WhatsApp",
  "signAgent": true,
  "signSeparator": "\n",
  "autoReopen": true,
  "startPending": false,
  "mergeBrPhones": true,
  "syncContacts": false,
  "syncMessages": false,
  "syncDays": 7,
  "ignoreChats": [],
  "autoCreate": true,
  "chatwootDbHost": "localhost",
  "chatwootDbPort": 5432,
  "chatwootDbUser": "postgres",
  "chatwootDbPass": "password",
  "chatwootDbName": "chatwoot"
}
```

### Configuration Fields
| Field | Description |
|-------|-------------|
| `enabled` | Enable/disable Chatwoot integration |
| `url` | Chatwoot instance URL |
| `token` | API access token |
| `account` | Chatwoot account ID |
| `inbox` | Inbox name (matched by session name) |
| `signAgent` | Add agent signature to messages |
| `signSeparator` | Separator between message and signature |
| `autoReopen` | Reopen resolved conversations on new message |
| `startPending` | Start new conversations as pending |
| `mergeBrPhones` | Merge Brazilian phone formats (9-digit) |
| `syncContacts` | Sync WhatsApp contacts to Chatwoot |
| `syncMessages` | Sync message history |
| `syncDays` | Days of history to sync |
| `ignoreChats` | JIDs to ignore |
| `autoCreate` | Auto-create contacts/conversations |
| `chatwootDb*` | Direct database connection for advanced features |

## Coding Conventions

- Use singular package names (model, service, handler)
- Use camelCase with double quotes for PostgreSQL columns
- Table prefix: `zp` (zpSessions, zpMessages, zpWebhooks)
- Repositories return `model.*` types, not `db.*` types
- Services handle business logic, handlers only HTTP
- Use zerolog for all logging
- Context propagation through all layers
- DTOs for request/response serialization
- Middleware for cross-cutting concerns

## Message Types

- `text` - Plain text messages
- `image` - Images with optional caption
- `video` - Videos with optional caption
- `audio` - Audio messages (PTT voice notes supported)
- `document` - Documents with filename
- `sticker` - Sticker messages
- `location` - Location sharing
- `live_location` - Live location sharing
- `contact` - Contact cards
- `poll` - Polls with voting
- `reaction` - Message reactions
- `interactive` - Interactive buttons/lists
- `protocol` - WhatsApp protocol messages
- `unknown` - Unrecognized message types

## Message Status

- `pending` - Waiting for server
- `sent` - Server received (single check)
- `delivered` - Delivered to recipient (double check)
- `read` - Read by recipient (blue checks)
- `played` - Audio/video played
- `failed` - Failed to send

## Testing

```bash
# Create session
curl -X POST -H "apikey: KEY" http://localhost:3000/sessions \
  -H "Content-Type: application/json" -d '{"name":"test"}'

# Connect and scan QR
curl -X POST -H "apikey: KEY" http://localhost:3000/sessions/test/connect

# Send text message
curl -X POST -H "apikey: KEY" -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","text":"Hello!"}' \
  http://localhost:3000/sessions/test/messages/text

# Send image
curl -X POST -H "apikey: KEY" -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","image":"base64...","caption":"Check this out!"}' \
  http://localhost:3000/sessions/test/messages/image

# Send buttons
curl -X POST -H "apikey: KEY" -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","contentText":"Choose:","buttons":[{"buttonId":"1","displayText":"Option 1"}]}' \
  http://localhost:3000/sessions/test/messages/buttons
```

## Dependencies Graph

```
main.go
  ├── config.Load()
  ├── logger.Init()
  ├── db.New() → PostgreSQL + whatsmeow sqlstore
  │     ├── Sessions (repository)
  │     ├── Messages (repository)
  │     ├── MessageUpdates (repository)
  │     ├── Webhooks (repository)
  │     ├── Media (repository)
  │     ├── Chat (repository)
  │     ├── Sticker (repository)
  │     ├── HistorySync (repository)
  │     └── Contact (repository)
  ├── service.NewStorageService() → MinIO/S3 client
  ├── service.NewWebhookService()
  ├── service.NewSessionService() → manages whatsmeow clients
  ├── service.NewWhatsAppService()
  ├── service.NewMediaService() → media processing
  ├── service.NewHistorySyncService() → history sync
  ├── chatwoot.NewService() → Chatwoot integration
  └── router.Setup() → Gin + handlers
        ├── SessionHandler
        ├── MessageHandler
        ├── GroupHandler
        ├── ContactHandler
        ├── ChatHandler
        ├── ProfileHandler
        ├── WebhookHandler
        ├── NewsletterHandler
        ├── StatusHandler
        ├── CallHandler
        ├── CommunityHandler
        └── MediaHandler
```
</coding_guidelines>
