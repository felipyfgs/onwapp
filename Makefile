.PHONY: build run dev clean swagger deps test lint fmt vet up down logs help version release cover rebuild

# Variables
BINARY_NAME=onwapp
MAIN_PATH=./cmd/onwapp
SWAGGER_PATH=./cmd/onwapp/main.go
GO ?= go

# Version info
VERSION ?= $(shell grep -E '^\s+Version\s*=' internal/version/version.go | head -1 | cut -d'"' -f2)
GIT_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS = -s -w -X onwapp/internal/version.Version=$(VERSION) -X onwapp/internal/version.GitCommit=$(GIT_COMMIT) -X onwapp/internal/version.BuildDate=$(BUILD_DATE)

# === MAIN ===

build:
	$(GO) build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME) $(MAIN_PATH)

run: build
	./$(BINARY_NAME)

dev:
	$(GO) run $(MAIN_PATH)

test:
	$(GO) test -v ./...

lint:
	golangci-lint run ./...

fmt:
	$(GO) fmt ./... && gofmt -s -w .

# === DOCKER - Development (dependencies only) ===

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

# === DOCKER - Production (separate images) ===

docker-build-api:
	docker build -f Dockerfile.api -t onwapp-api:latest \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg BUILD_DATE=$(BUILD_DATE) \
		.

docker-build-painel:
	docker build -f painel/Dockerfile -t onwapp-painel:latest ./painel

docker-build: docker-build-api docker-build-painel

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
	docker rmi onwapp-api:latest onwapp-painel:latest || true

# === OTHER ===

clean:
	rm -f $(BINARY_NAME) && $(GO) clean

deps:
	$(GO) mod download && $(GO) mod tidy

swagger:
	$(GO) install github.com/swaggo/swag/cmd/swag@latest
	~/go/bin/swag init -g $(SWAGGER_PATH) -o ./docs --parseDependency --parseInternal --useStructName

vet:
	$(GO) vet ./...

cover:
	$(GO) test -v -coverprofile=coverage.out ./... && $(GO) tool cover -html=coverage.out -o coverage.html

rebuild: clean deps swagger build

version:
	@echo "$(VERSION) ($(GIT_COMMIT))"

release:
	@if [ -z "$(GITHUB_TOKEN)" ]; then echo "Error: GITHUB_TOKEN required"; exit 1; fi
	goreleaser release --clean

help:
	@echo "Commands:"
	@echo "  build   - Build"
	@echo "  run     - Build & run"
	@echo "  dev     - Dev mode"
	@echo "  test    - Tests"
	@echo "  lint    - Linter"
	@echo "  fmt     - Format"
	@echo "  up      - Docker up"
	@echo "  down    - Docker down"
	@echo "  logs    - Docker logs"
	@echo "  clean   - Clean"
	@echo "  deps    - Dependencies"
	@echo "  swagger - Swagger docs"
	@echo "  cover   - Coverage"
	@echo "  rebuild - Full rebuild"
	@echo "  version - Version"
	@echo "  release - Release"
