package service

import (
	"context"
	"fmt"
	"os"
	"sync"

	"github.com/mdp/qrterminal/v3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// EventHandler is a function that handles WhatsApp events
type EventHandler func(session *model.Session, evt interface{})

type SessionService struct {
	container        *sqlstore.Container
	database         *db.Database
	webhookService   *WebhookService
	eventService     *EventService
	sessions         map[string]*model.Session
	mu               sync.RWMutex
	externalHandlers []EventHandler
}

func NewSessionService(container *sqlstore.Container, database *db.Database, webhookService *WebhookService) *SessionService {
	eventService := NewEventService(database, webhookService)
	return &SessionService{
		container:      container,
		database:       database,
		webhookService: webhookService,
		eventService:   eventService,
		sessions:       make(map[string]*model.Session),
	}
}

func (s *SessionService) LoadFromDatabase(ctx context.Context) error {
	records, err := s.database.Sessions.GetAll(ctx)
	if err != nil {
		return fmt.Errorf("failed to load sessions from database: %w", err)
	}

	var sessionsToReconnect []*model.Session

	for _, rec := range records {
		var device *store.Device

		if rec.DeviceJID != "" {
			jid, err := types.ParseJID(rec.DeviceJID)
			if err == nil {
				device, err = s.container.GetDevice(ctx, jid)
				if err != nil {
					logger.Warn().Err(err).Str("session", rec.Name).Msg("Failed to get device, creating new")
					device = s.container.NewDevice()
				}
			} else {
				device = s.container.NewDevice()
			}
		} else {
			device = s.container.NewDevice()
		}

		clientLog := waLog.Stdout("Client-"+rec.Name, "INFO", true)
		client := whatsmeow.NewClient(device, clientLog)

		session := &model.Session{
			ID:     rec.ID,
			Name:   rec.Name,
			Client: client,
			Device: device,
			Status: model.StatusDisconnected,
		}

		s.mu.Lock()
		s.sessions[rec.Name] = session
		s.mu.Unlock()

		logger.Info().Str("session", rec.Name).Str("jid", rec.DeviceJID).Str("phone", rec.Phone).Str("status", rec.Status).Msg("Session loaded from database")

		// Se a sessão tem credenciais válidas (deviceJID preenchido), reconecta automaticamente
		// O device.ID será preenchido pelo whatsmeow se houver credenciais no sqlstore
		if device.ID != nil {
			sessionsToReconnect = append(sessionsToReconnect, session)
			logger.Info().Str("session", rec.Name).Msg("Session has valid credentials, will auto-reconnect")
		}
	}

	// Reconectar sessões que estavam conectadas
	for _, session := range sessionsToReconnect {
		go s.reconnectSession(session)
	}

	return nil
}

func (s *SessionService) reconnectSession(session *model.Session) {
	logger.Info().Str("session", session.Name).Msg("Auto-reconnecting session...")

	s.setupEventHandler(session)

	if err := session.Client.Connect(); err != nil {
		logger.Error().Err(err).Str("session", session.Name).Msg("Failed to auto-reconnect session")
		session.SetStatus(model.StatusDisconnected)
		_ = s.database.Sessions.UpdateStatus(context.Background(), session.Name, "disconnected")
		return
	}

	session.SetStatus(model.StatusConnected)
	logger.Info().Str("session", session.Name).Msg("Session auto-reconnected successfully")
}

func (s *SessionService) Create(ctx context.Context, name string) (*model.Session, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.sessions[name]; exists {
		return nil, fmt.Errorf("session %s already exists", name)
	}

	// Save to database and get record
	rec, err := s.database.Sessions.Create(ctx, name)
	if err != nil {
		return nil, fmt.Errorf("failed to save session to database: %w", err)
	}

	device := s.container.NewDevice()
	clientLog := waLog.Stdout("Client-"+name, "INFO", true)
	client := whatsmeow.NewClient(device, clientLog)

	session := &model.Session{
		ID:        rec.ID,
		Name:      rec.Name,
		DeviceJID: rec.DeviceJID,
		Phone:     rec.Phone,
		Client:    client,
		Device:    device,
		Status:    model.StatusDisconnected,
		CreatedAt: rec.CreatedAt,
		UpdatedAt: rec.UpdatedAt,
	}

	s.sessions[name] = session
	return session, nil
}

func (s *SessionService) Get(name string) (*model.Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session, exists := s.sessions[name]
	if !exists {
		return nil, fmt.Errorf("session %s not found", name)
	}
	return session, nil
}

func (s *SessionService) Delete(ctx context.Context, name string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, exists := s.sessions[name]
	if !exists {
		return fmt.Errorf("session %s not found", name)
	}

	if session.Client.IsConnected() {
		session.Client.Disconnect()
	}

	if session.Device != nil && session.Device.ID != nil {
		if err := s.container.DeleteDevice(ctx, session.Device); err != nil {
			return fmt.Errorf("failed to delete device: %w", err)
		}
	}

	// Delete from database
	if err := s.database.Sessions.Delete(ctx, name); err != nil {
		logger.Warn().Err(err).Str("session", name).Msg("Failed to delete session from database")
	}

	delete(s.sessions, name)
	return nil
}

func (s *SessionService) List() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	names := make([]string, 0, len(s.sessions))
	for name := range s.sessions {
		names = append(names, name)
	}
	return names
}

func (s *SessionService) Connect(ctx context.Context, name string) (*model.Session, error) {
	session, err := s.Get(name)
	if err != nil {
		return nil, err
	}

	if session.Client.IsConnected() {
		return session, nil
	}

	session.SetStatus(model.StatusConnecting)
	s.setupEventHandler(session)

	if session.Client.Store.ID == nil {
		// New login - need QR code
		go s.startClientWithQR(session)
		return session, nil
	}

	// Already logged in - just connect
	if err := session.Client.Connect(); err != nil {
		session.SetStatus(model.StatusDisconnected)
		return nil, err
	}

	return session, nil
}

func (s *SessionService) startClientWithQR(session *model.Session) {
	qrChan, err := session.Client.GetQRChannel(context.Background())
	if err != nil {
		logger.Error().Err(err).Str("session", session.Name).Msg("Failed to get QR channel")
		session.SetStatus(model.StatusDisconnected)
		return
	}

	if err := session.Client.Connect(); err != nil {
		logger.Error().Err(err).Str("session", session.Name).Msg("Failed to connect client")
		session.SetStatus(model.StatusDisconnected)
		return
	}

	// Process QR events in the same goroutine (blocking)
	for evt := range qrChan {
		switch evt.Event {
		case "code":
			session.SetQR(evt.Code)
			session.SetStatus(model.StatusConnecting)
			qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
			logger.Info().Str("session", session.Name).Msg("QR code generated - scan with WhatsApp")
		case "success":
			session.SetStatus(model.StatusConnected)
			session.SetQR("")
			// Save JID and phone to database
			if session.Client.Store.ID != nil {
				jid := session.Client.Store.ID.String()
				phone := session.Client.Store.ID.User // Extrai o número do JID
				if err := s.database.Sessions.UpdateJID(context.Background(), session.Name, jid, phone); err != nil {
					logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session JID")
				}
				if err := s.database.Sessions.UpdateStatus(context.Background(), session.Name, "connected"); err != nil {
					logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session status")
				}
			}
			logger.Info().Str("session", session.Name).Msg("QR code scanned successfully")
			return
		case "timeout":
			session.SetStatus(model.StatusDisconnected)
			session.SetQR("")
			logger.Warn().Str("session", session.Name).Msg("QR code timeout")
			return
		}
	}
}

func (s *SessionService) setupEventHandler(session *model.Session) {
	session.Client.AddEventHandler(func(evt interface{}) {
		s.eventService.HandleEvent(session, evt)
		// Call external handlers (like Chatwoot)
		for _, handler := range s.externalHandlers {
			handler(session, evt)
		}
	})
}

// AddEventHandler registers an external event handler
func (s *SessionService) AddEventHandler(handler EventHandler) {
	s.externalHandlers = append(s.externalHandlers, handler)
}

func (s *SessionService) Logout(ctx context.Context, name string) error {
	session, err := s.Get(name)
	if err != nil {
		return err
	}

	if err := session.Client.Logout(ctx); err != nil {
		return err
	}

	session.SetStatus(model.StatusDisconnected)
	return nil
}

func (s *SessionService) Restart(ctx context.Context, name string) (*model.Session, error) {
	session, err := s.Get(name)
	if err != nil {
		return nil, err
	}

	if session.Client.IsConnected() {
		session.Client.Disconnect()
	}

	session.SetStatus(model.StatusDisconnected)

	if err := session.Client.Connect(); err != nil {
		return nil, err
	}

	session.SetStatus(model.StatusConnected)
	return session, nil
}
