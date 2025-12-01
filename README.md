# ZPWoot

<p align="center">
  <strong>WhatsApp API with Chatwoot Integration</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-documentation">API Docs</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#docker">Docker</a>
</p>

---

## Overview

ZPWoot is a comprehensive RESTful WhatsApp API built in Go using the [whatsmeow](https://github.com/tulir/whatsmeow) library. It provides multi-session WhatsApp management with full Chatwoot CRM integration, making it ideal for customer support and business communication.

## Features

### Core
- **Multi-session support** - Manage multiple WhatsApp accounts simultaneously
- **Auto-reconnect** - Sessions automatically reconnect on server restart
- **PostgreSQL persistence** - Full message history and session storage
- **MinIO/S3 storage** - Media files storage with automatic download
- **Swagger documentation** - Interactive API documentation

### Messaging
- Text, image, video, audio, document, sticker messages
- Location and contact cards
- Polls with voting support
- Interactive messages (buttons, lists, templates, carousels)
- Message reactions, editing, and deletion
- Reply/quote messages
- Disappearing messages

### Groups & Contacts
- Create and manage groups
- Add/remove participants, promote/demote admins
- Contact management with presence subscription
- Business profile support

### Chatwoot Integration
- Bidirectional message sync
- Contact auto-creation
- Delivery/read receipt sync
- Media attachment support
- Brazilian phone number normalization (9-digit merge)
- Agent signature on messages
- NATS JetStream queue for reliability

### Webhooks
- 60+ event types
- Configurable per session
- Secure delivery with optional signing

## Quick Start

### Prerequisites
- Go 1.24+
- PostgreSQL 16
- Docker & Docker Compose (optional)

### Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/onwapp/zpwoot.git
cd zpwoot

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Start all services
docker compose up -d

# Check logs
docker compose logs -f zpwoot
```

### Manual Installation

```bash
# Clone and build
git clone https://github.com/onwapp/zpwoot.git
cd zpwoot
make build

# Configure
cp .env.example .env
# Edit .env with your database and settings

# Run
./zpwoot
```

### First Steps

1. **Access Swagger UI**: http://localhost:3000/swagger/index.html

2. **Create a session**:
```bash
curl -X POST http://localhost:3000/sessions \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-session"}'
```

3. **Connect and scan QR**:
```bash
curl -X POST http://localhost:3000/sessions/my-session/connect \
  -H "apikey: YOUR_API_KEY"
```

4. **Send a message**:
```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/text \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "text": "Hello from ZPWoot!"}'
```

## API Documentation

Full API documentation is available at `/swagger/index.html` when the server is running.

### Main Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| Sessions | `POST /sessions` | Create new session |
| Sessions | `POST /sessions/:id/connect` | Connect and get QR |
| Messages | `POST /sessions/:id/messages/text` | Send text message |
| Messages | `POST /sessions/:id/messages/image` | Send image |
| Messages | `POST /sessions/:id/messages/audio` | Send audio/PTT |
| Groups | `POST /sessions/:id/groups` | Create group |
| Groups | `GET /sessions/:id/groups` | List groups |
| Contacts | `GET /sessions/:id/contacts` | List contacts |
| Contacts | `POST /sessions/:id/contacts/check` | Check WhatsApp numbers |

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/zpwoot?sslmode=disable

# Server
PORT=3000
API_KEY=your-secret-api-key
SERVER_URL=http://localhost:3000

# Logging
LOG_LEVEL=info    # debug, info, warn, error
LOG_FORMAT=console # console, json

# MinIO/S3 Storage (optional)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=zpwoot
MINIO_SECRET_KEY=zpwoot123
MINIO_BUCKET=zpwoot-media
MINIO_USE_SSL=false

# NATS Queue (optional)
NATS_ENABLED=false
NATS_URL=nats://localhost:4222
```

### Chatwoot Configuration

Create `chatwoot-config.json`:

```json
{
  "enabled": true,
  "url": "https://chatwoot.example.com",
  "token": "your-api-token",
  "account": 1,
  "inbox": "WhatsApp",
  "signAgent": true,
  "autoReopen": true,
  "mergeBrPhones": true,
  "autoCreate": true
}
```

## Docker

### Pull from Docker Hub

```bash
docker pull onwapp/zpwoot:latest
```

### Run with Docker

```bash
docker run -d \
  --name zpwoot \
  -p 3000:3000 \
  -e DATABASE_URL="postgres://user:pass@host:5432/zpwoot" \
  -e API_KEY="your-api-key" \
  onwapp/zpwoot:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  zpwoot:
    image: onwapp/zpwoot:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://zpwoot:zpwoot@postgres:5432/zpwoot?sslmode=disable
      - API_KEY=your-api-key
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: zpwoot
      POSTGRES_PASSWORD: zpwoot
      POSTGRES_DB: zpwoot
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Development

```bash
# Install dependencies
make deps

# Run in development mode
make dev

# Run tests
make test

# Run linter
make lint

# Generate Swagger docs
make swagger

# Build
make build

# Show version
make version
```

## Webhook Events

ZPWoot supports 60+ webhook events including:

- `message.received`, `message.sent`, `message.receipt`
- `session.connected`, `session.disconnected`, `session.qr`
- `group.update`, `group.joined`, `group.participants`
- `contact.update`, `contact.picture`
- `call.offer`, `call.reject`

See full list at `/events` endpoint.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<p align="center">
  Made with ❤️ for WhatsApp automation
</p>
