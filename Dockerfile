FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY onwapp .

EXPOSE 3000

ENTRYPOINT ["./onwapp"]
