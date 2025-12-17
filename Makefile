.PHONY: build dev test lint fmt clean deps swagger cover rebuild version release help
.PHONY: up down logs docker-build docker-prod-up docker-prod-down docker-prod-logs docker-prod-restart docker-clean
.PHONY: api-build api-run api-dev api-test api-lint api-fmt api-swagger api-cover
.PHONY: channel-install channel-dev channel-build channel-start channel-lint

# ===========================================
# Global Commands (orchestrate all services)
# ===========================================

build:
	$(MAKE) -C api build
	$(MAKE) -C channel build

dev:
	$(MAKE) -C api dev

test:
	$(MAKE) -C api test

lint:
	$(MAKE) -C api lint
	$(MAKE) -C channel lint

fmt:
	$(MAKE) -C api fmt

clean:
	$(MAKE) -C api clean
	$(MAKE) -C channel clean

deps:
	$(MAKE) -C api deps
	$(MAKE) -C channel install

swagger:
	$(MAKE) -C api swagger

cover:
	$(MAKE) -C api cover

rebuild:
	$(MAKE) -C api rebuild

version:
	$(MAKE) -C api version

# ===========================================
# API Service Commands
# ===========================================

api-build:
	$(MAKE) -C api build

api-run:
	$(MAKE) -C api run

api-dev:
	$(MAKE) -C api dev

api-test:
	$(MAKE) -C api test

api-lint:
	$(MAKE) -C api lint

api-fmt:
	$(MAKE) -C api fmt

api-swagger:
	$(MAKE) -C api swagger

api-cover:
	$(MAKE) -C api cover

# ===========================================
# Channel (Frontend) Commands
# ===========================================

channel-install:
	$(MAKE) -C channel install

channel-dev:
	$(MAKE) -C channel dev

channel-build:
	$(MAKE) -C channel build

channel-start:
	$(MAKE) -C channel start

channel-lint:
	$(MAKE) -C channel lint

# ===========================================
# Docker - Development (dependencies only)
# ===========================================

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

# ===========================================
# Docker - Production
# ===========================================

docker-build:
	$(MAKE) -C api docker-build

docker-prod-up:
	docker compose -f docker-compose.prod.yaml up -d

docker-prod-down:
	docker compose -f docker-compose.prod.yaml down

docker-prod-logs:
	docker compose -f docker-compose.prod.yaml logs -f

docker-prod-restart:
	docker compose -f docker-compose.prod.yaml restart

docker-clean:
	docker compose -f docker-compose.prod.yaml down -v
	docker rmi onwapp-api:latest || true

# ===========================================
# Release
# ===========================================

release:
	@if [ -z "$(GITHUB_TOKEN)" ]; then echo "Error: GITHUB_TOKEN required"; exit 1; fi
	cd api && goreleaser release --clean

# ===========================================
# Help
# ===========================================

help:
	@echo "OnWapp - Makefile Commands"
	@echo ""
	@echo "Global Commands:"
	@echo "  build      - Build all services"
	@echo "  dev        - Run API in development mode"
	@echo "  test       - Run all tests"
	@echo "  lint       - Lint all services"
	@echo "  fmt        - Format Go code"
	@echo "  clean      - Clean all build artifacts"
	@echo "  deps       - Install all dependencies"
	@echo "  swagger    - Generate Swagger docs"
	@echo "  cover      - Generate coverage report"
	@echo "  rebuild    - Full rebuild"
	@echo "  version    - Show version"
	@echo ""
	@echo "API Commands:"
	@echo "  api-build  - Build API binary"
	@echo "  api-run    - Build & run API"
	@echo "  api-dev    - Run API in dev mode"
	@echo "  api-test   - Run API tests"
	@echo "  api-lint   - Lint API code"
	@echo "  api-fmt    - Format API code"
	@echo "  api-swagger- Generate API docs"
	@echo "  api-cover  - API coverage report"
	@echo ""
	@echo "Channel Commands:"
	@echo "  channel-install - Install frontend deps"
	@echo "  channel-dev     - Run frontend dev server"
	@echo "  channel-build   - Build frontend"
	@echo "  channel-start   - Start frontend production"
	@echo "  channel-lint    - Lint frontend code"
	@echo ""
	@echo "Docker Commands:"
	@echo "  up         - Start dev dependencies"
	@echo "  down       - Stop dev dependencies"
	@echo "  logs       - View dev logs"
	@echo "  docker-build     - Build API image"
	@echo "  docker-prod-up   - Start production stack"
	@echo "  docker-prod-down - Stop production stack"
	@echo "  docker-prod-logs - View production logs"
	@echo "  docker-clean     - Clean docker resources"
