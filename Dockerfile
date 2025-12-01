FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=0.1.0
ARG GIT_COMMIT=unknown
ARG BUILD_DATE=unknown

RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags "-s -w -X zpwoot/internal/version.Version=${VERSION} -X zpwoot/internal/version.GitCommit=${GIT_COMMIT} -X zpwoot/internal/version.BuildDate=${BUILD_DATE}" \
    -o /app/zpwoot ./cmd/zpwoot

FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/zpwoot .

EXPOSE 3000

ENTRYPOINT ["./zpwoot"]
