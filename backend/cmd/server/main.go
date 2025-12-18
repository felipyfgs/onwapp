package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nats-io/nats.go"
)

func main() {
	// Configurar conexão NATS
	natsURL := "nats://localhost:4222"
	if url := os.Getenv("NATS_URL"); url != "" {
		natsURL = url
	}

	// Conectar ao servidor NATS
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	defer nc.Close()

	log.Printf("Connected to NATS server at %s", natsURL)

	// Configurar handlers de sinal para shutdown gracefully
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Iniciar serviços
	startServices(nc)

	// Aguardar sinal de término
	<-sigChan
	log.Println("Shutting down gracefully...")
}

func startServices(nc *nats.Conn) {
	// Subscriber para mensagens de chat
	if _, err := nc.Subscribe("chat.messages", func(msg *nats.Msg) {
		log.Printf("Received message on [chat.messages]: %s", string(msg.Data))
		// Processar mensagem de chat
		// TODO: Salvar no banco de dados, validar, etc.
	}); err != nil {
		log.Printf("Error subscribing to chat.messages: %v", err)
	}

	// Subscriber para atualizações de status
	if _, err := nc.Subscribe("user.status", func(msg *nats.Msg) {
		log.Printf("Received status update: %s", string(msg.Data))
		// Processar atualização de status
	}); err != nil {
		log.Printf("Error subscribing to user.status: %v", err)
	}

	// Publicar mensagem de heartbeat a cada 30 segundos
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		
		for range ticker.C {
			if err := nc.Publish("system.heartbeat", []byte("Backend is alive")); err != nil {
				log.Printf("Error publishing heartbeat: %v", err)
			}
		}
	}()

	log.Println("NATS services started successfully")
}