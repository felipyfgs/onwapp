.PHONY: build run dev clean swagger deps test lint fmt vet cover rebuild version

BINARY_NAME=onwapp
MAIN_PATH=./cmd/server
SWAGGER_PATH=./cmd/server/main.go
GO ?= go

VERSION ?= $(shell grep -E '^\s+Version\s*=' internal/version/version.go | head -1 | cut -d'"' -f2)
GIT_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS = -s -w -X onwapp/internal/version.Version=$(VERSION) -X onwapp/internal/version.GitCommit=$(GIT_COMMIT) -X onwapp/internal/version.BuildDate=$(BUILD_DATE)

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

vet:
	$(GO) vet ./...

clean:
	rm -f $(BINARY_NAME) && $(GO) clean

deps:
	$(GO) mod download && $(GO) mod tidy

swagger:
	$(GO) install github.com/swaggo/swag/cmd/swag@latest
	~/go/bin/swag init -g $(SWAGGER_PATH) -o ./docs --parseDependency --parseInternal --useStructName

cover:
	$(GO) test -v -coverprofile=coverage.out ./... && $(GO) tool cover -html=coverage.out -o coverage.html

rebuild: clean deps swagger build

version:
	@echo "$(VERSION) ($(GIT_COMMIT))"

docker-build:
	docker build -t onwapp-api:latest \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg BUILD_DATE=$(BUILD_DATE) \
		.

help:
	@echo "OnWapp API - Makefile Commands:"
	@echo "  build    - Build binary"
	@echo "  run      - Build & run"
	@echo "  dev      - Development mode (go run)"
	@echo "  test     - Run tests"
	@echo "  lint     - Run linter"
	@echo "  fmt      - Format code"
	@echo "  vet      - Run go vet"
	@echo "  clean    - Clean build artifacts"
	@echo "  deps     - Download dependencies"
	@echo "  swagger  - Generate Swagger docs"
	@echo "  cover    - Generate coverage report"
	@echo "  rebuild  - Full rebuild"
	@echo "  version  - Show version"
