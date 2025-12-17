# Makefile for Onwapp backend

.PHONY: run, build, migrate, clean, test

# Run the application
run:
	go run cmd/server/main.go

# Build the application
build:
	go build -o bin/onwapp cmd/server/main.go

# Run database migrations
migrate:
	go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest \
		-source file://internal/db/migrations \
		-database $(DATABASE_URL) up

# Clean build artifacts
clean:
	rm -rf bin/
	rm -rf uploads/

# Run tests
test:
	go test ./... -v

# Format code
fmt:
	gofmt -w .

# Install dependencies
deps:
	go mod tidy
