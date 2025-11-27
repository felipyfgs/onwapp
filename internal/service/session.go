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
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

type SessionService struct {
	container *sqlstore.Container
	database  *db.Database
	sessions  map[string]*model.Session
	mu        sync.RWMutex
}

func NewSessionService(container *sqlstore.Container, database *db.Database) *SessionService {
	return &SessionService{
		container: container,
		database:  database,
		sessions:  make(map[string]*model.Session),
	}
}

func (s *SessionService) LoadFromDatabase(ctx context.Context) error {
	records, err := s.database.GetAllSessions(ctx)
	if err != nil {
		return fmt.Errorf("failed to load sessions from database: %w", err)
	}

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
			Name:   rec.Name,
			Client: client,
			Device: device,
			Status: model.StatusDisconnected,
		}

		s.mu.Lock()
		s.sessions[rec.Name] = session
		s.mu.Unlock()

		logger.Info().Str("session", rec.Name).Str("jid", rec.DeviceJID).Msg("Session loaded from database")
	}

	return nil
}

func (s *SessionService) Create(ctx context.Context, name string) (*model.Session, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.sessions[name]; exists {
		return nil, fmt.Errorf("session %s already exists", name)
	}

	// Save to database
	if err := s.database.CreateSession(ctx, name); err != nil {
		return nil, fmt.Errorf("failed to save session to database: %w", err)
	}

	device := s.container.NewDevice()
	clientLog := waLog.Stdout("Client-"+name, "INFO", true)
	client := whatsmeow.NewClient(device, clientLog)

	session := &model.Session{
		Name:   name,
		Client: client,
		Device: device,
		Status: model.StatusDisconnected,
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
	if err := s.database.DeleteSession(ctx, name); err != nil {
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
			// Save JID to database
			if session.Client.Store.ID != nil {
				jid := session.Client.Store.ID.String()
				if err := s.database.UpdateSessionJID(context.Background(), session.Name, jid); err != nil {
					logger.Warn().Err(err).Str("session", session.Name).Msg("Failed to update session JID")
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
		switch evt.(type) {
		case *events.Connected:
			session.SetStatus(model.StatusConnected)
			session.SetQR("")
		case *events.Disconnected:
			session.SetStatus(model.StatusDisconnected)
		}
	})
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
