# Onwapp Makefile
# Comprehensive development commands for the entire project
# Usage: make <target>

.PHONY: help
.PHONY: setup
.PHONY: backend-*
.PHONY: frontend-*
.PHONY: db-*
.PHONY: infra-*
.PHONY: dev-*
.PHONY: test-*
.PHONY: clean-*
.PHONY: docker-*

# Colors for output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
BLUE   := $(shell tput -Txterm setaf 4)
RESET  := $(shell tput -Txterm sgr0)

# Default target
help:
	@echo ""
	@echo "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}"
	@echo "${BLUE}║                           Onwapp Development Commands                        ║${RESET}"
	@echo "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}"
	@echo ""
	@echo "${YELLOW}Setup Commands:${RESET}"
	@echo "  ${GREEN}make setup${RESET}           - Complete project setup (infra + deps)"
	@echo "  ${GREEN}make setup-infra${RESET}     - Start infrastructure services"
	@echo "  ${GREEN}make setup-backend${RESET}   - Install backend dependencies"
	@echo "  ${GREEN}make setup-frontend${RESET}  - Install frontend dependencies"
	@echo ""
	@echo "${YELLOW}Development Commands:${RESET}"
	@echo "  ${GREEN}make dev${RESET}             - Start both backend and frontend in development mode"
	@echo "  ${GREEN}make dev-backend${RESET}     - Start backend server only"
	@echo "  ${GREEN}make dev-frontend${RESET}    - Start frontend dev server only"
	@echo "  ${GREEN}make logs${RESET}            - Show logs from all services"
	@echo ""
	@echo "${YELLOW}Database Commands:${RESET}"
	@echo "  ${GREEN}make db-up${RESET}           - Run database migrations"
	@echo "  ${GREEN}make db-down${RESET}         - Rollback database migrations"
	@echo "  ${GREEN}make db-status${RESET}       - Show migration status"
	@echo "  ${GREEN}make db-reset${RESET}        - Reset database (drop + create + migrate)"
	@echo ""
	@echo "${YELLOW}Testing Commands:${RESET}"
	@echo "  ${GREEN}make test${RESET}            - Run all tests (backend + frontend)"
	@echo "  ${GREEN}make test-backend${RESET}    - Run backend tests"
	@echo "  ${GREEN}make test-frontend${RESET}   - Run frontend linting"
	@echo "  ${GREEN}make test-watch${RESET}      - Run backend tests in watch mode"
	@echo ""
	@echo "${YELLOW}Code Quality Commands:${RESET}"
	@echo "  ${GREEN}make fmt${RESET}             - Format all code (backend + frontend)"
	@echo "  ${GREEN}make fmt-backend${RESET}     - Format backend Go code"
	@echo "  ${GREEN}make fmt-frontend${RESET}    - Format frontend TypeScript/React code"
	@echo "  ${GREEN}make vet${RESET}             - Run Go vet"
	@echo "  ${GREEN}make lint${RESET}            - Run all linting (backend + frontend)"
	@echo ""
	@echo "${YELLOW}Build Commands:${RESET}"
	@echo "  ${GREEN}make build${RESET}           - Build both backend and frontend"
	@echo "  ${GREEN}make build-backend${RESET}   - Build backend binary"
	@echo "  ${GREEN}make build-frontend${RESET}  - Build frontend production"
	@echo ""
	@echo "${YELLOW}Infrastructure Commands:${RESET}"
	@echo "  ${GREEN}make infra-up${RESET}        - Start all infrastructure services"
	@echo "  ${GREEN}make infra-down${RESET}      - Stop all infrastructure services"
	@echo "  ${GREEN}make infra-logs${RESET}      - Show infrastructure logs"
	@echo "  ${GREEN}make infra-clean${RESET}     - Clean up volumes and networks"
	@echo ""
	@echo "${YELLOW}Docker Commands:${RESET}"
	@echo "  ${GREEN}make docker-build${RESET}    - Build Docker images"
	@echo "  ${GREEN}make docker-clean${RESET}    - Clean up Docker resources"
	@echo ""
	@echo "${YELLOW}Cleanup Commands:${RESET}"
	@echo "  ${GREEN}make clean${RESET}           - Clean all build artifacts"
	@echo "  ${GREEN}make clean-backend${RESET}   - Clean backend artifacts"
	@echo "  ${GREEN}make clean-frontend${RESET}  - Clean frontend artifacts"
	@echo ""
	@echo "${YELLOW}Git Commands:${RESET}"
	@echo "  ${GREEN}make status${RESET}          - Show git status"
	@echo "  ${GREEN}make diff${RESET}            - Show git diff"
	@echo ""
	@echo "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}"
	@echo "${BLUE}║                              Quick Start Guide                               ║${RESET}"
	@echo "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}"
	@echo ""
	@echo "  1. ${GREEN}make setup${RESET}         - Setup everything"
	@echo "  2. ${GREEN}make dev${RESET}           - Start development servers"
	@echo "  3. Open http://localhost:3000"
	@echo ""

# Setup Commands
setup: setup-infra setup-backend setup-frontend
	@echo "${GREEN}✓ Project setup complete!${RESET}"

setup-infra:
	@echo "${YELLOW}🚀 Starting infrastructure services...${RESET}"
	docker compose up -d dev_postgres dev_nats dev_minio
	@echo "${GREEN}✓ Infrastructure started${RESET}"

setup-backend:
	@echo "${YELLOW}📦 Setting up backend dependencies...${RESET}"
	cd backend && go mod tidy
	@echo "${GREEN}✓ Backend dependencies ready${RESET}"

setup-frontend:
	@echo "${YELLOW}📦 Setting up frontend dependencies...${RESET}"
	cd frontend && npm install
	@echo "${GREEN}✓ Frontend dependencies ready${RESET}"

# Infrastructure Commands
infra-up:
	@echo "${YELLOW}🚀 Starting all infrastructure services...${RESET}"
	docker compose up -d
	@echo "${GREEN}✓ All services started${RESET}"

infra-down:
	@echo "${YELLOW}🛑 Stopping all infrastructure services...${RESET}"
	docker compose down
	@echo "${GREEN}✓ All services stopped${RESET}"

infra-logs:
	@echo "${YELLOW}📋 Showing infrastructure logs...${RESET}"
	docker compose logs -f

infra-clean:
	@echo "${YELLOW}🧹 Cleaning up infrastructure...${RESET}"
	docker compose down -v
	docker system prune -f
	@echo "${GREEN}✓ Infrastructure cleaned${RESET}"

# Development Commands
dev: dev-backend dev-frontend

dev-backend:
	@echo "${YELLOW}🔧 Starting backend server...${RESET}"
	cd backend && go run cmd/server/main.go

dev-frontend:
	@echo "${YELLOW}🔧 Starting frontend development server...${RESET}"
	cd frontend && npm run dev

logs:
	@echo "${YELLOW}📋 Showing logs from all services...${RESET}"
	docker compose logs -f

# Database Commands
db-up:
	@echo "${YELLOW}🗄️  Running database migrations...${RESET}"
	cd backend && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-source file://internal/db/migrations \
		-database "$$DATABASE_URL" up

db-down:
	@echo "${YELLOW}🗄️  Rolling back database migrations...${RESET}"
	cd backend && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-source file://internal/db/migrations \
		-database "$$DATABASE_URL" down

db-status:
	@echo "${YELLOW}🗄️  Checking migration status...${RESET}"
	cd backend && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-source file://internal/db/migrations \
		-database "$$DATABASE_URL" version

db-reset:
	@echo "${YELLOW}🗄️  Resetting database...${RESET}"
	@echo "This will drop and recreate the database. Continue? (y/N)"
	@read -r response && if [ "$$response" != "y" ] && [ "$$response" != "Y" ]; then \
		echo "Aborted."; exit 1; \
	fi
	docker compose exec dev_postgres dropdb -U $${POSTGRES_USER:-postgres} $${POSTGRES_DB:-onwapp}
	docker compose exec dev_postgres createdb -U $${POSTGRES_USER:-postgres} $${POSTGRES_DB:-onwapp}
	make db-up

# Testing Commands
test: test-backend test-frontend

test-backend:
	@echo "${YELLOW}🧪 Running backend tests...${RESET}"
	cd backend && go test ./... -v

test-frontend:
	@echo "${YELLOW}🧪 Running frontend linting...${RESET}"
	cd frontend && npm run lint

test-watch:
	@echo "${YELLOW}🧪 Running backend tests in watch mode...${RESET}"
	cd backend && go test -watch ./...

# Code Quality Commands
fmt: fmt-backend fmt-frontend

fmt-backend:
	@echo "${YELLOW}✨ Formatting backend Go code...${RESET}"
	cd backend && gofmt -w .

fmt-frontend:
	@echo "${YELLOW}✨ Formatting frontend code...${RESET}"
	cd frontend && npx prettier --write .

vet:
	@echo "${YELLOW}🔍 Running Go vet...${RESET}"
	cd backend && go vet ./...

lint: vet test-frontend

# Build Commands
build: build-backend build-frontend

build-backend:
	@echo "${YELLOW}🔨 Building backend...${RESET}"
	cd backend && go build -o bin/onwapp cmd/server/main.go
	@echo "${GREEN}✓ Backend built successfully${RESET}"

build-frontend:
	@echo "${YELLOW}🔨 Building frontend...${RESET}"
	cd frontend && npm run build
	@echo "${GREEN}✓ Frontend built successfully${RESET}"

# Cleanup Commands
clean: clean-backend clean-frontend

clean-backend:
	@echo "${YELLOW}🧹 Cleaning backend artifacts...${RESET}"
	cd backend && rm -rf bin/ uploads/

clean-frontend:
	@echo "${YELLOW}🧹 Cleaning frontend artifacts...${RESET}"
	cd frontend && rm -rf .next/ node_modules/.cache/

# Docker Commands
docker-build:
	@echo "${YELLOW}🐳 Building Docker images...${RESET}"
	docker compose -f docker-compose.prod.yaml build
	@echo "${GREEN}✓ Docker images built${RESET}"

docker-clean:
	@echo "${YELLOW}🐳 Cleaning Docker resources...${RESET}"
	docker system prune -f
	@echo "${GREEN}✓ Docker resources cleaned${RESET}"

# Git Commands
status:
	@echo "${YELLOW}📊 Git status:${RESET}"
	git status

diff:
	@echo "${YELLOW}📊 Git diff:${RESET}"
	git diff

# Health Check
health:
	@echo "${YELLOW}🏥 Checking service health...${RESET}"
	@echo "Backend: $(shell curl -s http://localhost:8080/health || echo 'DOWN')"
	@echo "Frontend: $(shell curl -s http://localhost:3000 || echo 'DOWN')"
	@echo "PostgreSQL: $(shell docker compose exec dev_postgres pg_isready -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-onwapp} && echo 'UP' || echo 'DOWN')"
	@echo "NATS: $(shell curl -s http://localhost:8222/healthz || echo 'DOWN')"

# Production Commands
prod-up:
	@echo "${YELLOW}🚀 Starting production stack...${RESET}"
	docker compose -f docker-compose.prod.yaml up -d
	@echo "${GREEN}✓ Production stack started${RESET}"

prod-down:
	@echo "${YELLOW}🛑 Stopping production stack...${RESET}"
	docker compose -f docker-compose.prod.yaml down
	@echo "${GREEN}✓ Production stack stopped${RESET}"

# Development with Watch Mode
dev-watch:
	@echo "${YELLOW}👀 Starting development with watch mode...${RESET}"
	@echo "Backend will restart on Go file changes"
	@echo "Frontend will restart on React file changes"
	@echo ""
	@echo "Use: make dev-backend (in one terminal)"
	@echo "Use: make dev-frontend (in another terminal)"

# Quick Commands
quickstart: setup dev

reload:
	@echo "${YELLOW}🔄 Reloading services...${RESET}"
	make infra-down
	make infra-up
	@echo "${GREEN}✓ Services reloaded${RESET}"
