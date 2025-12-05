package service

import (
	"context"
	"fmt"
	"os"
	"sync"

	"github.com/mdp/qrterminal/v3"
	"github.com/rs/zerolog"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"

	"onwapp/internal/db"
	"onwapp/internal/logger"
	"onwapp/internal/model"
	"onwapp/internal/service/event"
)

// EventHandler is a function that handles WhatsApp events
type EventHandler func(session *model.Session, evt interface{})

// WebhookSender defines the interface for sending webhooks
type WebhookSender interface {
	Send(ctx context.Context, sessionID, sessionId, event string, rawEvent interface{})
}

type SessionService struct {
	container        *sqlstore.Container
	database         *db.Database
	webhookService   WebhookSender
	eventService     *event.Service
	sessions         map[string]*model.Session
	mu               sync.RWMutex
	externalHandlers []EventHandler
}

func NewSessionService(container *sqlstore.Container, database *db.Database, webhookService WebhookSender) *SessionService {
	eventService := event.New(database, webhookService)
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
					logger.Session().Warn().Err(err).Str("session", rec.Session).Msg("Failed to get device, creating new")
					device = s.container.NewDevice()
				}
			} else {
				device = s.container.NewDevice()
			}
		} else {
			device = s.container.NewDevice()
		}

		clientLog := waLog.Zerolog(logger.ModuleLevel("WPP", zerolog.InfoLevel))
		client := whatsmeow.NewClient(device, clientLog)

		session := &model.Session{
			ID:        rec.ID,
			Session:   rec.Session,
			DeviceJID: rec.DeviceJID,
			Phone:     rec.Phone,
			ApiKey:    rec.ApiKey,
			Client:    client,
			Device:    device,
			Status:    model.StatusDisconnected,
			CreatedAt: rec.CreatedAt,
			UpdatedAt: rec.UpdatedAt,
		}

		s.mu.Lock()
		s.sessions[rec.Session] = session
		s.mu.Unlock()

		logger.Session().Info().Str("session", rec.Session).Str("jid", rec.DeviceJID).Str("phone", rec.Phone).Str("status", rec.Status).Msg("Session loaded from database")

		// Se a sessão tem credenciais válidas (deviceJID preenchido), reconecta automaticamente
		// O device.ID será preenchido pelo whatsmeow se houver credenciais no sqlstore
		if device != nil && device.ID != nil {
			sessionsToReconnect = append(sessionsToReconnect, session)
			logger.Session().Info().Str("session", rec.Session).Msg("Session has valid credentials, will auto-reconnect")
		}
	}

	// Reconectar sessões que estavam conectadas
	for _, session := range sessionsToReconnect {
		go s.reconnectSession(session)
	}

	return nil
}

func (s *SessionService) reconnectSession(session *model.Session) {
	logger.Session().Info().Str("session", session.Session).Msg("Auto-reconnecting session...")

	s.setupEventHandler(session)

	if err := session.Client.Connect(); err != nil {
		logger.Session().Error().Err(err).Str("session", session.Session).Msg("Failed to auto-reconnect session")
		session.SetStatus(model.StatusDisconnected)
		_ = s.database.Sessions.UpdateStatus(context.Background(), session.Session, "disconnected")
		return
	}

	session.SetStatus(model.StatusConnected)
	logger.Session().Info().Str("session", session.Session).Msg("Session auto-reconnected successfully")
}

func (s *SessionService) Create(ctx context.Context, sessionId string, apiKey string) (*model.Session, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.sessions[sessionId]; exists {
		return nil, fmt.Errorf("session %s already exists", sessionId)
	}

	// Save to database and get record
	rec, err := s.database.Sessions.Create(ctx, sessionId, apiKey)
	if err != nil {
		return nil, fmt.Errorf("failed to save session to database: %w", err)
	}

	device := s.container.NewDevice()
	clientLog := waLog.Zerolog(logger.ModuleLevel("WPP", zerolog.InfoLevel))
	client := whatsmeow.NewClient(device, clientLog)

	session := &model.Session{
		ID:        rec.ID,
		Session:   rec.Session,
		DeviceJID: rec.DeviceJID,
		Phone:     rec.Phone,
		ApiKey:    rec.ApiKey,
		Client:    client,
		Device:    device,
		Status:    model.StatusDisconnected,
		CreatedAt: rec.CreatedAt,
		UpdatedAt: rec.UpdatedAt,
	}

	s.sessions[sessionId] = session
	return session, nil
}

func (s *SessionService) Get(sessionId string) (*model.Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session, exists := s.sessions[sessionId]
	if !exists {
		return nil, fmt.Errorf("session %s not found", sessionId)
	}
	return session, nil
}

// GetByID finds a session by its UUID (session.ID field)
func (s *SessionService) GetByID(id string) (*model.Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, session := range s.sessions {
		if session.ID == id {
			return session, nil
		}
	}
	return nil, fmt.Errorf("session with ID %s not found", id)
}

func (s *SessionService) Delete(ctx context.Context, sessionId string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, exists := s.sessions[sessionId]
	if !exists {
		return fmt.Errorf("session %s not found", sessionId)
	}

	hasCredentials := session.Device != nil && session.Device.ID != nil

	// If we have credentials, properly logout from WhatsApp server first
	if hasCredentials {
		// If not connected, try to connect first so we can send logout to server
		if !session.Client.IsConnected() {
			logger.Session().Info().Str("session", sessionId).Msg("Connecting to send logout request before delete...")
			if err := session.Client.Connect(); err != nil {
				logger.Session().Warn().Err(err).Str("session", sessionId).Msg("Failed to connect for logout, will delete locally only")
			}
		}

		// Send logout to WhatsApp server (removes device from their servers)
		if session.Client.IsConnected() {
			if err := session.Client.Logout(ctx); err != nil {
				logger.Session().Warn().Err(err).Str("session", sessionId).Msg("Failed to logout from WhatsApp server")
				session.Client.Disconnect()
			}
		}

		// Ensure device is deleted from whatsmeow store
		if err := s.container.DeleteDevice(ctx, session.Device); err != nil {
			logger.Session().Debug().Err(err).Str("session", sessionId).Msg("DeleteDevice (may already be deleted by Logout)")
		}
	} else {
		// No credentials, just disconnect if connected
		if session.Client.IsConnected() {
			session.Client.Disconnect()
		}
	}

	// Delete from database
	if err := s.database.Sessions.Delete(ctx, sessionId); err != nil {
		logger.Session().Warn().Err(err).Str("session", sessionId).Msg("Failed to delete session from database")
	}

	delete(s.sessions, sessionId)
	logger.Session().Info().Str("session", sessionId).Msg("Session deleted successfully")
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

func (s *SessionService) Connect(ctx context.Context, sessionId string) (*model.Session, error) {
	session, err := s.Get(sessionId)
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
		logger.Session().Error().Err(err).Str("session", session.Session).Msg("Failed to get QR channel")
		session.SetStatus(model.StatusDisconnected)
		return
	}

	if err := session.Client.Connect(); err != nil {
		logger.Session().Error().Err(err).Str("session", session.Session).Msg("Failed to connect client")
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
			logger.Session().Info().Str("session", session.Session).Msg("QR code generated - scan with WhatsApp")
		case "success":
			session.SetStatus(model.StatusConnected)
			session.SetQR("")
			// Save JID and phone to database
			if session.Client.Store.ID != nil {
				jid := session.Client.Store.ID.String()
				phone := session.Client.Store.ID.User // Extrai o número do JID
				if err := s.database.Sessions.UpdateJID(context.Background(), session.Session, jid, phone); err != nil {
					logger.Session().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session JID")
				}
				if err := s.database.Sessions.UpdateStatus(context.Background(), session.Session, "connected"); err != nil {
					logger.Session().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session status")
				}
			}
			logger.Session().Info().Str("session", session.Session).Msg("QR code scanned successfully")
			return
		case "timeout":
			session.SetStatus(model.StatusDisconnected)
			session.SetQR("")
			logger.Session().Warn().Str("session", session.Session).Msg("QR code timeout")
			return
		}
	}
}

func (s *SessionService) setupEventHandler(session *model.Session) {
	session.Client.AddEventHandler(func(evt interface{}) {
		// First, save message to database so UpdateCwFields can work
		s.eventService.HandleEvent(session, evt)

		// Then call external handlers (like Chatwoot) to create message in Chatwoot
		// They can now UpdateCwFields because message exists in DB
		for _, handler := range s.externalHandlers {
			handler(session, evt)
		}
	})
}

// AddEventHandler registers an external event handler
func (s *SessionService) AddEventHandler(handler EventHandler) {
	s.externalHandlers = append(s.externalHandlers, handler)
}

// EmitSyntheticEvent emits a synthetic event for messages sent via API.
// Saves message to database first, then notifies external handlers (like Chatwoot).
func (s *SessionService) EmitSyntheticEvent(sessionId string, evt interface{}) {
	session, err := s.Get(sessionId)
	if err != nil {
		logger.Session().Debug().Err(err).Str("session", sessionId).Msg("EmitSyntheticEvent: session not found")
		return
	}

	// First, save message to database so UpdateCwFields can work
	s.eventService.HandleEvent(session, evt)

	// Then call external handlers (like Chatwoot) to create message in Chatwoot
	for _, handler := range s.externalHandlers {
		handler(session, evt)
	}
}

// SetMediaService sets the media service for downloading media to storage
func (s *SessionService) SetMediaService(mediaService *MediaService) {
	s.eventService.SetMediaService(mediaService)
}

// SetHistorySyncService sets the history sync service for processing sync data
func (s *SessionService) SetHistorySyncService(historySyncService *HistorySyncService) {
	s.eventService.SetHistorySyncService(historySyncService)
}

// SetWebhookSkipChecker sets the function that determines if webhook should be skipped
// for certain session/event combinations (e.g., when Chatwoot handles message webhooks)
func (s *SessionService) SetWebhookSkipChecker(checker event.WebhookSkipChecker) {
	s.eventService.SetWebhookSkipChecker(checker)
}

// SetSettingsProvider sets the settings provider for auto-reject calls and privacy sync
func (s *SessionService) SetSettingsProvider(provider event.SettingsProvider) {
	s.eventService.SetSettingsProvider(provider)
}

// SetCallRejecter sets the call rejecter for auto-reject calls
func (s *SessionService) SetCallRejecter(rejecter event.CallRejecter) {
	s.eventService.SetCallRejecter(rejecter)
}

// SetPrivacyGetter sets the privacy getter for syncing privacy settings from WhatsApp
func (s *SessionService) SetPrivacyGetter(getter event.PrivacyGetter) {
	s.eventService.SetPrivacyGetter(getter)
}

// SetPresenceSender sets the presence sender for keepOnline feature
func (s *SessionService) SetPresenceSender(sender event.PresenceSender) {
	s.eventService.SetPresenceSender(sender)
}

// Disconnect disconnects the session but keeps credentials for auto-reconnect
func (s *SessionService) Disconnect(ctx context.Context, sessionId string) error {
	session, err := s.Get(sessionId)
	if err != nil {
		return err
	}

	if session.Client.IsConnected() {
		session.Client.Disconnect()
	}

	session.SetStatus(model.StatusDisconnected)
	if err := s.database.Sessions.UpdateStatus(ctx, sessionId, "disconnected"); err != nil {
		logger.Session().Warn().Err(err).Str("session", sessionId).Msg("Failed to update session status")
	}

	return nil
}

// Logout logs out from WhatsApp and clears credentials (requires new QR scan to reconnect)
// This sends remove-companion-device to WhatsApp server and deletes local credentials
func (s *SessionService) Logout(ctx context.Context, sessionId string) error {
	session, err := s.Get(sessionId)
	if err != nil {
		return err
	}

	hasCredentials := session.Device != nil && session.Device.ID != nil

	// If we have credentials, we need to properly logout from WhatsApp server
	if hasCredentials {
		// If not connected, try to connect first so we can send logout to server
		if !session.Client.IsConnected() {
			logger.Session().Info().Str("session", sessionId).Msg("Connecting to send logout request...")
			if err := session.Client.Connect(); err != nil {
				logger.Session().Warn().Err(err).Str("session", sessionId).Msg("Failed to connect for logout, will clear locally only")
			}
		}

		// Send logout to WhatsApp server (removes device from their servers)
		// This calls: sendIQ(remove-companion-device) + Disconnect() + Store.Delete()
		if session.Client.IsConnected() {
			if err := session.Client.Logout(ctx); err != nil {
				logger.Session().Warn().Err(err).Str("session", sessionId).Msg("Failed to logout from WhatsApp server")
				// Even if logout fails, disconnect and clear locally
				session.Client.Disconnect()
			}
		}

		// Ensure device is deleted from whatsmeow store (in case Logout() failed)
		if err := s.container.DeleteDevice(ctx, session.Device); err != nil {
			logger.Session().Debug().Err(err).Str("session", sessionId).Msg("DeleteDevice (may already be deleted by Logout)")
		}
	} else {
		// No credentials, just disconnect if connected
		if session.Client.IsConnected() {
			session.Client.Disconnect()
		}
	}

	// Clear JID and phone in database but keep the session record
	if err := s.database.Sessions.UpdateJID(ctx, sessionId, "", ""); err != nil {
		logger.Session().Warn().Err(err).Str("session", sessionId).Msg("Failed to clear session JID")
	}
	if err := s.database.Sessions.UpdateStatus(ctx, sessionId, "disconnected"); err != nil {
		logger.Session().Warn().Err(err).Str("session", sessionId).Msg("Failed to update session status")
	}

	// Create new device for next connection
	session.Device = s.container.NewDevice()
	session.Client.Store = session.Device
	session.DeviceJID = ""
	session.Phone = ""
	session.SetStatus(model.StatusDisconnected)
	session.SetQR("")

	logger.Session().Info().Str("session", sessionId).Msg("Session logged out successfully")
	return nil
}

func (s *SessionService) Restart(ctx context.Context, sessionId string) (*model.Session, error) {
	session, err := s.Get(sessionId)
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
