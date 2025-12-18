# Dockerfile para o backend Go do ONWApp

# Usar imagem oficial do Go
FROM golang:1.21-alpine AS builder

# Configurar ambiente de trabalho
WORKDIR /app

# Copiar arquivos de dependência
COPY go.mod go.sum ./

# Baixar dependências
RUN go mod download

# Copiar código fonte
COPY . .

# Compilar o aplicativo
RUN CGO_ENABLED=0 GOOS=linux go build -o /onwapp-backend ./cmd/server/main.go

# Imagem final
FROM alpine:latest

# Copiar binário compilado
COPY --from=builder /onwapp-backend /onwapp-backend

# Expor porta
EXPOSE 8081

# Executar aplicativo
CMD ["/onwapp-backend"]