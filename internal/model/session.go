package model

import (
	"sync"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
)

type SessionStatus string

const (
	StatusDisconnected SessionStatus = "disconnected"
	StatusConnecting   SessionStatus = "connecting"
	StatusConnected    SessionStatus = "connected"
	StatusQR           SessionStatus = "qr"
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
