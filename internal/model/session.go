package model

import (
	"sync"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
)

type SessionStatus string

const (
	StatusDisconnected SessionStatus = "disconnected"
	StatusConnecting   SessionStatus = "connecting"
	StatusConnected    SessionStatus = "connected"
)

type ChatPresence string

const (
	ChatPresenceComposing ChatPresence = "composing"
	ChatPresencePaused    ChatPresence = "paused"
)

type ChatPresenceMedia string

const (
	ChatPresenceMediaText  ChatPresenceMedia = ""
	ChatPresenceMediaAudio ChatPresenceMedia = "audio"
)

type SessionRecord struct {
	ID        string
	SessionId string
	DeviceJID string
	Phone     string
	Status    string
	CreatedAt *time.Time
	UpdatedAt *time.Time
}

type Session struct {
	ID        string
	SessionId string
	Name      string // Deprecated: use SessionId instead (kept for compatibility)
	DeviceJID string
	Phone     string
	Client    *whatsmeow.Client
	Device    *store.Device
	Status    SessionStatus
	QRCode    string
	CreatedAt *time.Time
	UpdatedAt *time.Time
	mu        sync.RWMutex
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
