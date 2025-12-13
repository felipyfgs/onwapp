# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OnWapp is a WhatsApp API Bridge - a powerful REST API for WhatsApp built with Go. It provides multi-session support, full messaging capabilities, group management, newsletters, status updates, media storage, webhooks, and Chatwoot integration.

## Tech Stack

- **Backend**: Go 1.24+ (Gin framework)
- **Database**: PostgreSQL 14+
- **Message Queue**: NATS (optional)
- **Storage**: MinIO/S3 (optional)
- **WhatsApp Library**: whatsmeow (WhatsApp Web API)
- **Admin Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Additional**: Radix UI components, NATS WebSocket for real-time updates

## Common Commands

### Go Backend

```bash
# Development
make dev                    # Run in development mode with hot reload
go run cmd/onwapp/main.go   # Direct Go run

# Building
make build                 # Build the binary
make rebuild              # Full rebuild (clean + deps + swagger + build)
make clean                # Clean build artifacts

# Testing
make test                 # Run all tests
make cover                # Run tests with coverage report

# Code Quality
make lint                 # Run golangci-lint
make fmt                  # Format code
make vet                  # Run go vet

# Dependencies
make deps                 # Download and tidy dependencies

# Documentation
make swagger              # Generate Swagger docs

# Docker (Development)
make up                   # Start development services
make down                 # Stop development services
make logs                 # View service logs

# Docker (Production)
make docker-build         # Build production Docker images
make docker-prod-up       # Start production services
make docker-prod-down     # Stop production services
```

### Admin Frontend (Next.js)

```bash
cd admin

# Development
npm run dev              # Start development server (http://localhost:3000)

# Building
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
```

## Architecture

### Backend Structure

- `cmd/onwapp/` - Application entry point and main configuration
- `internal/api/` - HTTP handlers, middleware, and routing
- `internal/config/` - Configuration management and environment variables
- `internal/db/` - Database models, migrations, and connections
- `internal/integrations/` - External service integrations:
  - `chatwoot/` - Customer support platform integration
  - `webhook/` - Generic webhook handling
- `internal/model/` - Domain models and business entities
- `internal/service/` - Core business logic and services
- `internal/version/` - Version information

### Frontend Structure

- `admin/app/` - Next.js 16 App Router structure
- `admin/components/` - Reusable React components organized by feature
- `admin/hooks/` - Custom React hooks for state management and API calls
- `admin/lib/` - Utilities and configurations

### Key Components

1. **Session Management**: Multi-session WhatsApp support with per-session API keys
2. **Message Handling**: Support for all WhatsApp message types (text, media, interactive)
3. **Real-time Updates**: NATS-based real-time messaging between backend and frontend
4. **Webhook System**: Configurable event notifications
5. **Chatwoot Integration**: Built-in customer support platform sync
6. **Media Storage**: S3-compatible storage for media files

## Development Workflow

1. **Backend Development**:
   - Use `make dev` for hot reload during development
   - Follow Go best practices and use golangci-lint
   - Add tests for new functionality
   - Update Swagger documentation when modifying APIs

2. **Frontend Development**:
   - Use `npm run dev` in the admin directory
   - Components use Radix UI with Tailwind CSS styling
   - Real-time updates via NATS WebSocket connections
   - Custom hooks for API calls and state management

3. **Database**:
   - PostgreSQL is the primary database
   - Use migrations for schema changes
   - Connection pooling via pgx driver

4. **Testing**:
   - Backend tests use Go's testing package
   - Use `make test` for backend, configure ESLint for frontend
   - Coverage reports available with `make cover`

## Configuration

- Environment variables defined in `.env` (copy from `.env.example`)
- Database connection, API keys, webhook URLs configurable
- Docker Compose setup for local development
- Production-ready Docker configuration available

## Key Dependencies

### Go Backend
- `github.com/gin-gonic/gin` - HTTP web framework
- `go.mau.fi/whatsmeow` - WhatsApp Web API library (forked version)
- `github.com/jackc/pgx/v5` - PostgreSQL driver
- `github.com/nats-io/nats.go` - NATS messaging
- `github.com/rs/zerolog` - Structured logging

### Frontend
- Next.js 16 with App Router
- React 19 with TypeScript
- Tailwind CSS v4 for styling
- Radix UI for accessible components
- NATS WebSocket client for real-time updates

## API Documentation

- Swagger UI available at `/swagger/index.html` when running
- Full REST API documentation in `docs/API.md`
- All endpoints require authentication via API key or session key

## Important Notes

- The project uses a forked version of whatsmeow with custom modifications
- Chatwoot integration is deeply integrated for customer support workflows
- NATS messaging provides real-time updates between backend and frontend
- S3-compatible storage required for media files
- Multi-tenant architecture with per-session API keys