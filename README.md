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

## Quick Start

### Prerequisites

- Go 1.24+
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

# Start services
docker-compose up -d
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/felipyfgs/onwapp.git
cd onwapp

# Install dependencies
go mod download

# Copy and configure environment
cp .env.example .env

# Run
go run cmd/server/main.go
```

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

- **REST API**: See [docs/API.md](docs/API.md)
- **Swagger UI**: http://localhost:8080/swagger/index.html

## Project Structure

```
onwapp/
├── cmd/
│   └── onwapp/          # Application entrypoint
├── internal/
│   ├── api/             # HTTP handlers and routing
│   ├── config/          # Configuration management
│   ├── db/              # Database and migrations
│   ├── integrations/    # Chatwoot, webhooks
│   ├── logger/          # Logging utilities
│   ├── model/           # Domain models
│   ├── service/         # Business logic
│   └── version/         # Version info
├── docs/                # Documentation
└── docker/              # Docker configs
```

## Development

```bash
# Run with hot reload
make dev

# Run tests
make test

# Lint
make lint

# Build
make build
```

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
- **Documentation**: [docs/API.md](docs/API.md)
