# OnWapp

WhatsApp API Bridge - A powerful REST API for WhatsApp built with Go.

## Features

- **Multi-session support** - Manage multiple WhatsApp accounts simultaneously
- **Full messaging** - Text, images, videos, documents, audio, stickers, locations, contacts
- **Interactive messages** - Polls, buttons, lists, carousels, templates
- **Group management** - Create, manage, invite, participants, settings
- **Newsletters/Channels** - Create and manage WhatsApp channels
- **Status/Stories** - Post and manage status updates
- **Media storage** - S3-compatible storage for media files
- **Webhooks** - Real-time event notifications
- **Chatwoot integration** - Built-in customer support platform integration
- **Session API keys** - Per-session authentication for multi-tenant setups
- **Rate limiting** - Configurable rate limits
- **Swagger docs** - Interactive API documentation

## Tech Stack

- **Go 1.24+** - Backend
- **PostgreSQL** - Database
- **NATS** - Message queue (optional)
- **MinIO/S3** - Media storage (optional)
- **whatsmeow** - WhatsApp Web API library
- **Next.js** - Frontend (Channel)

## Project Structure

```
onwapp/
├── api/                        # Backend Go (REST API)
│   ├── cmd/server/             # Application entrypoint
│   ├── internal/               # Core application code
│   │   ├── api/                # HTTP handlers and routing
│   │   ├── config/             # Configuration management
│   │   ├── db/                 # Database and migrations
│   │   ├── integrations/       # Chatwoot, webhooks
│   │   ├── service/            # Business logic
│   │   └── ...
│   ├── docs/                   # Swagger documentation
│   ├── go.mod
│   └── Makefile
│
├── channel/                    # Frontend Next.js
│   ├── app/                    # Next.js App Router
│   ├── components/             # React components
│   ├── lib/                    # Utilities and API client
│   └── package.json
│
├── Makefile                    # Global orchestrator
├── docker-compose.yaml         # Development stack
├── docker-compose.prod.yaml    # Production stack
└── AGENTS.md                   # AI agent guidelines
```

## Quick Start

### Prerequisites

- Go 1.24+
- Node.js 20+ (for frontend)
- PostgreSQL 14+
- Docker (optional)

### Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/felipyfgs/onwapp.git
cd onwapp

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start development dependencies
make up

# Run API in development mode
make api-dev

# In another terminal, run frontend
make channel-install
make channel-dev
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/felipyfgs/onwapp.git
cd onwapp

# Install API dependencies
cd api
go mod download

# Install frontend dependencies
cd ../channel
cd ../../apps/channel
npm install

# Copy and configure environment
cd ../..
cp .env.example .env

# Run API
make api-dev

# Run frontend (another terminal)
make channel-dev
```

## Available Commands

### Global Commands

| Command | Description |
|---------|-------------|
| `make build` | Build all services |
| `make dev` | Run API in development mode |
| `make test` | Run all tests |
| `make lint` | Lint all services |
| `make deps` | Install all dependencies |
| `make up` | Start dev dependencies (Docker) |
| `make down` | Stop dev dependencies |

### API Commands

| Command | Description |
|---------|-------------|
| `make api-build` | Build API binary |
| `make api-dev` | Run API in dev mode |
| `make api-test` | Run API tests |
| `make api-lint` | Lint API code |
| `make api-swagger` | Generate Swagger docs |

### Channel (Frontend) Commands

| Command | Description |
|---------|-------------|
| `make channel-install` | Install frontend deps |
| `make channel-dev` | Run frontend dev server |
| `make channel-build` | Build frontend |
| `make channel-lint` | Lint frontend code |

## Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
nano .env  # Edit with your settings
```

See `.env.example` for all available configuration options.

## API Usage

### Authentication

All API requests require the `Authorization` header:

```bash
curl -H "Authorization: $API_KEY" http://localhost:8080/sessions
```

### Create a Session

```bash
curl -X POST http://localhost:8080/sessions \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"session": "my-session"}'
```

### Connect and Get QR Code

```bash
# Connect
curl -X POST http://localhost:8080/my-session/connect \
  -H "Authorization: $API_KEY"

# Get QR code
curl http://localhost:8080/my-session/qr \
  -H "Authorization: $API_KEY"
```

### Send a Message

```bash
curl -X POST http://localhost:8080/my-session/message/send/text \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "text": "Hello from OnWapp!"}'
```

## API Documentation

- **REST API**: See [services/api/docs/API.md](services/api/docs/API.md)
- **Swagger UI**: http://localhost:8080/swagger/index.html

## Webhooks

Configure webhooks to receive real-time events:

```bash
curl -X POST http://localhost:8080/my-session/webhook \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["message.received", "message.sent"],
    "enabled": true
  }'
```

### Available Events

- `session.connected`, `session.disconnected`, `session.qr`
- `message.received`, `message.sent`, `message.delivered`, `message.read`
- `chat.presence`, `chat.archived`
- `group.created`, `group.updated`, `group.participant_added`
- `call.received`, `call.missed`

## Chatwoot Integration

OnWapp includes built-in Chatwoot integration for customer support:

```bash
curl -X POST http://localhost:8080/sessions/my-session/chatwoot/set \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://chatwoot.example.com",
    "apiAccessToken": "$CHATWOOT_TOKEN",
    "accountId": 1,
    "inboxId": 1
  }'
```

## Development

```bash
# Run API with hot reload
make api-dev

# Run frontend dev server
make channel-dev

# Run tests
make test

# Lint all code
make lint

# Build all
make build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the **Apache License 2.0 with additional conditions** - see the [LICENSE](LICENSE) file for details.

**Key points:**
- Commercial use allowed with attribution
- Cannot remove OnWapp logo/branding from frontend
- Must display notification that OnWapp is being used
- Cannot rebrand without permission
- Contact contato@onwapp.com.br for commercial licensing

## Disclaimer

This project is not affiliated with WhatsApp or Meta. Use at your own risk and ensure compliance with WhatsApp's Terms of Service.

## Support

- **Issues**: [GitHub Issues](https://github.com/felipyfgs/onwapp/issues)
- **Documentation**: [services/api/docs/API.md](services/api/docs/API.md)
