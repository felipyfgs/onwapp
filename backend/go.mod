module github.com/obsidian/onwapp/backend

go 1.24.0

toolchain go1.24.11

require github.com/nats-io/nats.go v1.47.0

require (
	github.com/golang/protobuf v1.5.4 // indirect
	github.com/nats-io/nats-server/v2 v2.12.3 // indirect
	github.com/nats-io/nkeys v0.4.12 // indirect
	github.com/nats-io/nuid v1.0.1 // indirect
	golang.org/x/crypto v0.46.0 // indirect
	golang.org/x/sys v0.39.0 // indirect
	google.golang.org/protobuf v1.36.11 // indirect
)

replace github.com/nats-io/nats.go => github.com/nats-io/nats.go v1.25.0
