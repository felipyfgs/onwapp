FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY zpwoot .

EXPOSE 3000

ENTRYPOINT ["./zpwoot"]
