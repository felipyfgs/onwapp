# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /onwapp cmd/server/main.go

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy binary from builder
COPY --from=builder /onwapp /app/onwapp

# Copy migrations
COPY internal/db/migrations /app/migrations

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy .env.example
COPY .env.example .env

# Install migrate tool
RUN apk add --no-cache curl
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz && \
    mv migrate.linux-amd64 /usr/local/bin/migrate && \
    chmod +x /usr/local/bin/migrate

# Run migrations and start application
CMD ["sh", "-c", "migrate -path=/app/migrations -database=$DATABASE_URL up && ./onwapp"]
