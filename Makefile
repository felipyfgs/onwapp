.PHONY: build run dev clean swagger deps test lint docker-build docker-up docker-down dev-up dev-down dev-logs help version release release-dry

# Variables
BINARY_NAME=zpwoot
MAIN_PATH=./cmd/zpwoot
SWAGGER_PATH=./cmd/zpwoot/main.go
GO ?= go

# Version info (read from version.go or use defaults)
VERSION ?= $(shell grep -E '^\s+Version\s*=' internal/version/version.go | head -1 | cut -d'"' -f2)
GIT_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS = -s -w -X zpwoot/internal/version.Version=$(VERSION) -X zpwoot/internal/version.GitCommit=$(GIT_COMMIT) -X zpwoot/internal/version.BuildDate=$(BUILD_DATE)

# Build the application
build:
	$(GO) build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME) $(MAIN_PATH)

# Run the application
run: build
	./$(BINARY_NAME)

# Run in development mode (with hot reload if air is installed)
dev:
	$(GO) run $(MAIN_PATH)

# Clean build artifacts
clean:
	rm -f $(BINARY_NAME)
	$(GO) clean

# Generate Swagger documentation
swagger:
	$(GO) install github.com/swaggo/swag/cmd/swag@latest
	~/go/bin/swag init -g $(SWAGGER_PATH) -o ./docs --parseDependency --parseInternal --useStructName

# Install dependencies
deps:
	$(GO) mod download
	$(GO) mod tidy

# Run tests
test:
	$(GO) test -v ./...

# Run tests with coverage
test-cover:
	$(GO) test -v -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html

# Run linter (requires golangci-lint)
lint:
	golangci-lint run ./...

# Format code
fmt:
	$(GO) fmt ./...
	gofmt -s -w .

# Vet code
vet:
	$(GO) vet ./...

# Build Docker image
docker-build:
	docker build -t $(BINARY_NAME):latest .

# Start Docker Compose services
docker-up:
	docker compose up -d

# Stop Docker Compose services
docker-down:
	docker compose down

# View Docker logs
docker-logs:
	docker compose logs -f

# Start dev Docker Compose services (full stack)
dev-up:
	docker compose -f docker/docker-compose.dev.yaml up -d

# Stop dev Docker Compose services
dev-down:
	docker compose -f docker/docker-compose.dev.yaml down

# View dev Docker logs
dev-logs:
	docker compose -f docker/docker-compose.dev.yaml logs -f

# Database migrations (if needed)
migrate-up:
	$(GO) run ./cmd/migrate up

migrate-down:
	$(GO) run ./cmd/migrate down

# Full rebuild: clean, deps, swagger, build
rebuild: clean deps swagger build

# Development setup
setup: deps swagger build
	@echo "Setup complete! Run 'make run' to start the server."

# Help
help:
	@echo "Available targets:"
	@echo "  build        - Build the application"
	@echo "  run          - Build and run the application"
	@echo "  dev          - Run in development mode"
	@echo "  clean        - Clean build artifacts"
	@echo "  swagger      - Generate Swagger documentation"
	@echo "  deps         - Install dependencies"
	@echo "  test         - Run tests"
	@echo "  test-cover   - Run tests with coverage"
	@echo "  lint         - Run linter"
	@echo "  fmt          - Format code"
	@echo "  vet          - Vet code"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-up    - Start Docker Compose services"
	@echo "  docker-down  - Stop Docker Compose services"
	@echo "  docker-logs  - View Docker Compose logs"
	@echo "  dev-up       - Start dev environment (full stack)"
	@echo "  dev-down     - Stop dev environment"
	@echo "  dev-logs     - View dev environment logs"
	@echo "  rebuild      - Full rebuild (clean, deps, swagger, build)"
	@echo "  setup        - Development setup"
	@echo "  version      - Show current version"
	@echo "  release-dry  - Test release build (no publish)"
	@echo "  release      - Create and publish release"
	@echo "  help         - Show this help"

# Show version
version:
	@echo "Version: $(VERSION)"
	@echo "Commit:  $(GIT_COMMIT)"
	@echo "Date:    $(BUILD_DATE)"

# Test release build (dry run)
release-dry:
	goreleaser release --snapshot --clean --skip=publish

# Create release (requires GITHUB_TOKEN)
release:
	@if [ -z "$(GITHUB_TOKEN)" ]; then \
		echo "Error: GITHUB_TOKEN is required"; \
		exit 1; \
	fi
	goreleaser release --clean

# Tag a new version
tag:
	@if [ -z "$(TAG)" ]; then \
		echo "Usage: make tag TAG=v0.1.0"; \
		exit 1; \
	fi
	git tag -a $(TAG) -m "Release $(TAG)"
	git push origin $(TAG)
