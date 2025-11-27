package service

import (
	"context"
	"fmt"
	"sync"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"

	"zpwoot/internal/model"
)

type SessionService struct {
	container *sqlstore.Container
	sessions  map[string]*model.Session
	mu        sync.RWMutex
}

func NewSessionService(container *sqlstore.Container) *SessionService {
	return &SessionService{
		container: container,
		sessions:  make(map[string]*model.Session),
	}
}

func (s *SessionService) Create(ctx context.Context, name string) (*model.Session, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.sessions[name]; exists {
		return nil, fmt.Errorf("session %s already exists", name)
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

func (s *SessionService) Connect(ctx context.Context, name string) (*model.Session, <-chan whatsmeow.QRChannelItem, error) {
	session, err := s.Get(name)
	if err != nil {
		return nil, nil, err
	}

	if session.Client.IsConnected() {
		return session, nil, nil
	}

	session.SetStatus(model.StatusConnecting)

	if session.Client.Store.ID == nil {
		qrChan, _ := session.Client.GetQRChannel(ctx)
		if err := session.Client.Connect(); err != nil {
			session.SetStatus(model.StatusDisconnected)
			return nil, nil, err
		}
		s.setupEventHandler(session)
		return session, qrChan, nil
	}

	if err := session.Client.Connect(); err != nil {
		session.SetStatus(model.StatusDisconnected)
		return nil, nil, err
	}

	s.setupEventHandler(session)
	session.SetStatus(model.StatusConnected)
	return session, nil, nil
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

func (s *SessionService) HandleQRChannel(session *model.Session, qrChan <-chan whatsmeow.QRChannelItem) {
	for evt := range qrChan {
		switch evt.Event {
		case "code":
			session.SetQR(evt.Code)
			session.SetStatus(model.StatusConnecting)
		case "success":
			session.SetStatus(model.StatusConnected)
			session.SetQR("")
		case "timeout":
			session.SetStatus(model.StatusDisconnected)
			session.SetQR("")
		}
	}
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
