.PHONY: build run dev clean swagger deps test lint docker-build docker-up docker-down help

# Variables
BINARY_NAME=zpwoot
MAIN_PATH=./cmd/zpwoot
SWAGGER_PATH=./cmd/zpwoot/main.go
GO=/usr/local/go/bin/go

# Build the application
build:
	$(GO) build -o $(BINARY_NAME) $(MAIN_PATH)

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
	~/go/bin/swag init -g $(SWAGGER_PATH) -o ./docs --parseDependency --parseInternal

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
	@echo "  rebuild      - Full rebuild (clean, deps, swagger, build)"
	@echo "  setup        - Development setup"
	@echo "  help         - Show this help"
