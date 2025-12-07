# Stage 1: Build Go API
FROM golang:1.24-alpine AS go-builder

RUN apk add --no-cache git

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=dev
ARG GIT_COMMIT=unknown
ARG BUILD_DATE=unknown

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags "-s -w -X onwapp/internal/version.Version=${VERSION} -X onwapp/internal/version.GitCommit=${GIT_COMMIT} -X onwapp/internal/version.BuildDate=${BUILD_DATE}" \
    -o onwapp ./cmd/onwapp

# Stage 2: Build Next.js Painel
FROM node:20-alpine AS node-builder

WORKDIR /build

COPY painel/package.json painel/package-lock.json ./
RUN npm ci

COPY painel/ .

# Remove .env.local and set basePath for production
RUN rm -f .env.local
ENV NEXT_PUBLIC_BASE_PATH=/painel

RUN npm run build

# Stage 3: Final image
FROM node:20-alpine

RUN apk add --no-cache ca-certificates tzdata bash

ENV TZ=America/Sao_Paulo
ENV DOCKER_ENV=true

WORKDIR /app

# Copy Go binary
COPY --from=go-builder /build/onwapp ./onwapp

# Copy Next.js standalone
COPY --from=node-builder /build/.next/standalone ./painel/
COPY --from=node-builder /build/.next/static ./painel/.next/static
COPY --from=node-builder /build/public ./painel/public

# Copy entrypoint script
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000 3001

ENTRYPOINT ["/bin/bash", "-c", "./entrypoint.sh"]
