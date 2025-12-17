package messaging

import (
	"context"
	"fmt"
	"log"
	"sync"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"onwapp/internal/models"
)

type MessagingClient struct {
	clients map[uuid.UUID]*ClientWrapper
	mu      sync.Mutex
	db      *pgx.Conn
	logger  waLog.Logger
}

type ClientWrapper struct {
	Client     *whatsmeow.Client
	Session    *models.MessagingSession
	Connection *sqlstore.Container
}

func NewWhatsAppClient(db *pgx.Conn) *WhatsAppClient {
	return &WhatsAppClient{
		clients: make(map[uuid.UUID]*ClientWrapper),
		db:      db,
		logger:  waLog.Stdout("WhatsApp", "INFO", true),
	}
}

func (w *WhatsAppClient) InitializeSession(ctx context.Context, session *models.WhatsAppSession) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	// Create SQL store container
	container, err := sqlstore.New("postgres", w.db.Conn().PgConn().Config().ConnString(), waLog.Noop)
	if err != nil {
		return fmt.Errorf("failed to create SQL store: %w", err)
	}

	// Create device
	deviceStore := container.GetDevice(session.PhoneNumber)
	clientLog := waLog.Stdout("Client-"+session.PhoneNumber, "INFO", true)

	// Create client
	client := whatsmeow.NewClient(deviceStore, clientLog)

	// Set up event handlers
	w.setupEventHandlers(client, session.ID)

	// Store client wrapper
	w.clients[session.ID] = &ClientWrapper{
		Client:     client,
		Session:    session,
		Connection: container,
	}

	return nil
}

func (w *WhatsAppClient) ConnectSession(sessionID uuid.UUID) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	client, ok := w.clients[sessionID]
	if !ok {
		return fmt.Errorf("session not found")
	}

	if client.Client.IsConnected() {
		return nil
	}

	// Connect to WhatsApp
	if err := client.Client.Connect(); err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	return nil
}

func (w *WhatsAppClient) DisconnectSession(sessionID uuid.UUID) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	client, ok := w.clients[sessionID]
	if !ok {
		return fmt.Errorf("session not found")
	}

	if !client.Client.IsConnected() {
		return nil
	}

	// Disconnect from WhatsApp
	client.Client.Disconnect()
	return nil
}

func (w *WhatsAppClient) GetQRCode(sessionID uuid.UUID) ([]byte, error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	client, ok := w.clients[sessionID]
	if !ok {
		return nil, fmt.Errorf("session not found")
	}

	if client.Client.IsConnected() {
		return nil, fmt.Errorf("already connected")
	}

	// Get QR code channel
	qrChan, _ := client.Client.GetQRChannel(context.Background())
	
	// Generate QR code
	qrCode := <-qrChan
	if qrCode == nil {
		return nil, fmt.Errorf("failed to generate QR code")
	}

	return qrCode, nil
}

func (w *WhatsAppClient) setupEventHandlers(client *whatsmeow.Client, sessionID uuid.UUID) {
	// Handle incoming messages
	client.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *events.Message:
			if v.Info.IsFromMe {
				return
			}
			
			// Process incoming message
			go w.handleIncomingMessage(v, sessionID)
		}
	})

	// Handle connection events
	client.AddEventHandler(func(evt interface{}) {
		switch evt.(type) {
		case *events.Connected:
			log.Printf("Session %s connected", sessionID)
		case *events.Disconnected:
			log.Printf("Session %s disconnected", sessionID)
		}
	})
}

func (w *WhatsAppClient) handleIncomingMessage(msg *events.Message, sessionID uuid.UUID) {
	// TODO: Implement message handling logic
	// - Find or create contact
	// - Find or create ticket
	// - Save message to database
	// - Publish event via NATS
}

func (w *WhatsAppClient) SendMessage(sessionID uuid.UUID, chatJID types.JID, message string) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	client, ok := w.clients[sessionID]
	if !ok {
		return fmt.Errorf("session not found")
	}

	if !client.Client.IsConnected() {
		return fmt.Errorf("session not connected")
	}

	// Send message
	_, err := client.Client.SendMessage(context.Background(), chatJID, &waE2E.Message{
		Conversation: msg,
	})

	return err
}
