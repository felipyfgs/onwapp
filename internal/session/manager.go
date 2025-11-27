package session

import (
	"context"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

type SessionStatus string

const (
	StatusDisconnected SessionStatus = "disconnected"
	StatusConnecting   SessionStatus = "connecting"
	StatusConnected    SessionStatus = "connected"
	StatusQR           SessionStatus = "qr"
)

type Session struct {
	Name   string
	Client *whatsmeow.Client
	Device *store.Device
	Status SessionStatus
	QRCode string
	mu     sync.RWMutex
}

func (s *Session) SetStatus(status SessionStatus) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Status = status
}

func (s *Session) GetStatus() SessionStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.Status
}

func (s *Session) SetQR(qr string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.QRCode = qr
}

func (s *Session) GetQR() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.QRCode
}

type Manager struct {
	pool      *pgxpool.Pool
	container *sqlstore.Container
	sessions  map[string]*Session
	mu        sync.RWMutex
}

func NewManager(pool *pgxpool.Pool) *Manager {
	return &Manager{
		pool:     pool,
		sessions: make(map[string]*Session),
	}
}

func (m *Manager) Init(ctx context.Context) error {
	dbLog := waLog.Stdout("Database", "INFO", true)

	connStr := m.pool.Config().ConnString()
	container, err := sqlstore.New("pgx", connStr, dbLog)
	if err != nil {
		return fmt.Errorf("failed to create sqlstore: %w", err)
	}

	m.container = container
	return nil
}

func (m *Manager) Create(ctx context.Context, name string) (*Session, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.sessions[name]; exists {
		return nil, fmt.Errorf("session %s already exists", name)
	}

	device := m.container.NewDevice()

	clientLog := waLog.Stdout("Client-"+name, "INFO", true)
	client := whatsmeow.NewClient(device, clientLog)

	session := &Session{
		Name:   name,
		Client: client,
		Device: device,
		Status: StatusDisconnected,
	}

	m.sessions[name] = session
	return session, nil
}

func (m *Manager) Get(name string) (*Session, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	session, exists := m.sessions[name]
	if !exists {
		return nil, fmt.Errorf("session %s not found", name)
	}

	return session, nil
}

func (m *Manager) Delete(ctx context.Context, name string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	session, exists := m.sessions[name]
	if !exists {
		return fmt.Errorf("session %s not found", name)
	}

	if session.Client.IsConnected() {
		session.Client.Disconnect()
	}

	if session.Device != nil && session.Device.ID != nil {
		if err := m.container.DeleteDevice(session.Device); err != nil {
			return fmt.Errorf("failed to delete device: %w", err)
		}
	}

	delete(m.sessions, name)
	return nil
}

func (m *Manager) List() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	names := make([]string, 0, len(m.sessions))
	for name := range m.sessions {
		names = append(names, name)
	}
	return names
}
