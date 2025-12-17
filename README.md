# Onwapp - WhatsApp-style Customer Service System

A complete customer service platform inspired by WhatsApp Business API, built with Go (Fiber), PostgreSQL, NATS, and Next.js.

## System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐   │
│   │             │    │             │    │                                 │   │
│   │  Frontend   │    │   Backend   │    │          PostgreSQL             │   │
│   │  (Next.js)  │◄───►│    (Go)     │◄───►│  (Tickets, Messages, Contacts)  │   │
│   │             │    │             │    │                                 │   │
│   └─────────────┘    └─────────────┘    └─────────────────────────────────┘   │
│           ▲                  ▲                    ▲                           │
│           │                  │                    │                           │
│   ┌───────┴───────┐  ┌──────┴──────┐      ┌──────┴──────┐                   │
│   │               │  │             │      │             │                   │
│   │   NATS.ws     │  │  WhatsApp   │      │   Redis    │                   │
│   │  (Real-time)  │  │  (whatsmeow)│      │  (Caching) │                   │
│   │               │  │             │      │             │                   │
│   └───────────────┘  └─────────────┘      └─────────────┘                   │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Features

- **Multi-tenancy Support**: Multiple businesses on one platform
- **Real-time Messaging**: NATS.ws for instant updates
- **WhatsApp Integration**: Using whatsmeow library
- **Ticket Management**: Full ticket lifecycle management
- **Multi-platform**: Support for WhatsApp, Telegram, Instagram (extensible)
- **Authentication**: JWT-based auth with role-based access control
- **Modern UI**: Next.js 14 with shadcn/ui components

## Local Development Setup

### Prerequisites

- Go 1.22+
- Node.js 18+
- PostgreSQL 16+
- NATS Server
- Docker (optional, for services)

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL and NATS using Docker
docker compose -f docker-compose.yaml up -d dev_postgres dev_nats

# Or install locally:
# - PostgreSQL: https://www.postgresql.org/download/
# - NATS: https://nats.io/download/
```

### 2. Set Up Environment Variables

Create `.env` file in backend directory:

```env
# Server
PORT=8080
ENV=development

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/onwapp?sslmode=disable

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# NATS
NATS_URL=nats://localhost:4222

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

Create `.env.local` file in frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_NATS_URL=ws://localhost:8222
```

### 3. Run Database Migrations

```bash
cd backend
make migrate
```

### 4. Start Backend Server

```bash
cd backend
go run cmd/server/main.go
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- NATS WebSocket: ws://localhost:8222
- PostgreSQL: localhost:5432

## Project Structure

```
onwapp/
├── backend/              # Go backend (Fiber)
│   ├── cmd/server/       # Main application
│   ├── internal/         # Core application
│   │   ├── configs/      # Configuration
│   │   ├── db/           # Database (PostgreSQL)
│   │   ├── handlers/     # HTTP handlers
│   │   ├── middleware/   # Middleware
│   │   ├── models/       # Data models
│   │   ├── messaging/    # Messaging clients
│   │   ├── nats/         # NATS integration
│   │   ├── router/       # API router
│   │   └── services/     # Business logic
│   └── pkg/              # Shared packages
│       ├── hash/         # Password hashing
│       ├── jwt/          # JWT utilities
│       └── validator/    # Request validation
│
└── frontend/             # Next.js frontend
    ├── app/              # App router
    │   ├── (auth)/        # Authentication pages
    │   └── dashboard/     # Main application
    │       ├── tickets/   # Ticket management
    │       ├── connections/ # Messaging connections
    │       └── ...        # Other pages
    ├── components/       # UI components
    ├── hooks/            # Custom hooks
    ├── lib/              # Libraries
    │   ├── api/          # API clients
    │   └── stores/       # Zustand stores
    └── ...               # Next.js config
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/validate` - Validate token

### Tenants
- `GET /api/v1/tenants` - List tenants
- `POST /api/v1/tenants` - Create tenant
- `GET /api/v1/tenants/:id` - Get tenant
- `PUT /api/v1/tenants/:id` - Update tenant
- `DELETE /api/v1/tenants/:id` - Delete tenant

### Messaging Sessions
- `GET /api/v1/sessions` - List sessions
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions/:id` - Get session
- `PUT /api/v1/sessions/:id` - Update session
- `DELETE /api/v1/sessions/:id` - Delete session
- `POST /api/v1/sessions/:id/connect` - Connect session
- `POST /api/v1/sessions/:id/disconnect` - Disconnect session
- `GET /api/v1/sessions/:id/qrcode` - Get QR code

### Tickets
- `GET /api/v1/tickets` - List tickets
- `POST /api/v1/tickets` - Create ticket
- `GET /api/v1/tickets/:id` - Get ticket
- `PUT /api/v1/tickets/:id` - Update ticket
- `DELETE /api/v1/tickets/:id` - Delete ticket

### Messages
- `GET /api/v1/tickets/:id/messages` - List messages
- `POST /api/v1/tickets/:id/messages` - Send message
- `PUT /api/v1/messages/:id/read` - Mark message as read

## Real-time Events

The system uses NATS for real-time updates:

- `ticket.created` - New ticket created
- `ticket.updated` - Ticket updated
- `ticket.assigned` - Ticket assigned to agent
- `ticket.status_changed` - Ticket status changed
- `message.received` - New message received
- `message.sent` - Message sent
- `message.read` - Message read
- `session.connected` - Messaging session connected
- `session.disconnected` - Messaging session disconnected

## Database Schema

The system uses PostgreSQL with the following main tables:

- `tenants` - Business tenants
- `users` - User accounts
- `messaging_sessions` - Messaging platform connections
- `contacts` - Customer contacts
- `queues` - Support queues
- `tickets` - Support tickets
- `messages` - Chat messages

## Development Workflow

1. **Backend Development**: Work in `/backend` directory
   - Run tests: `go test ./... -v`
   - Format code: `gofmt -w .`
   - Build: `go build -o bin/onwapp cmd/server/main.go`

2. **Frontend Development**: Work in `/frontend` directory
   - Run dev server: `npm run dev`
   - Build: `npm run build`
   - Lint: `npm run lint`

3. **Database**: 
   - Run migrations: `make migrate`
   - Create new migration: Add files to `backend/internal/db/migrations/`

## Deployment

For production deployment:

1. Build backend: `cd backend && go build -o bin/onwapp cmd/server/main.go`
2. Build frontend: `cd frontend && npm run build`
3. Set up environment variables
4. Run database migrations
5. Start services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Write tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
