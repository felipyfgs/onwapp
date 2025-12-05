package wpp

import (
	"context"
	"fmt"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/appstate"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"

	"onwapp/internal/model"
)

// MarkRead marks messages as read
func (s *Service) MarkRead(ctx context.Context, sessionId, phone string, messageIDs []string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	ids := make([]types.MessageID, len(messageIDs))
	for i, id := range messageIDs {
		ids[i] = types.MessageID(id)
	}

	return client.MarkRead(ctx, ids, time.Now(), jid, jid)
}

// ArchiveChat archives or unarchives a chat
func (s *Service) ArchiveChat(ctx context.Context, sessionId, phone string, archive bool) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendAppState(ctx, appstate.BuildArchive(jid, archive, time.Time{}, nil))
}

// MarkChatUnread marks a chat as unread
func (s *Service) MarkChatUnread(ctx context.Context, sessionId, phone string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendAppState(ctx, appstate.BuildMarkChatAsRead(jid, false, time.Time{}, nil))
}

// DeleteMessage deletes a message
func (s *Service) DeleteMessage(ctx context.Context, sessionId, phone, messageID string, forMe bool) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	if forMe {
		return client.SendMessage(ctx, jid, client.BuildRevoke(jid, types.EmptyJID, messageID))
	}
	return client.SendMessage(ctx, jid, client.BuildRevoke(jid, jid, messageID))
}

// EditMessage edits a message
func (s *Service) EditMessage(ctx context.Context, sessionId, phone, messageID, newText string) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendMessage(ctx, jid, client.BuildEdit(jid, messageID, &waE2E.Message{
		Conversation: proto.String(newText),
	}))
}

// SendPresence sends presence status (available/unavailable)
func (s *Service) SendPresence(ctx context.Context, sessionId string, available bool) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	presence := types.PresenceUnavailable
	if available {
		presence = types.PresenceAvailable
	}

	return client.SendPresence(ctx, presence)
}

// SendChatPresence sends typing/recording status
func (s *Service) SendChatPresence(ctx context.Context, sessionId, phone string, state model.ChatPresence, media model.ChatPresenceMedia) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendChatPresence(ctx, jid, types.ChatPresence(state), types.ChatPresenceMedia(media))
}

// SendChatPresenceRaw sends chat presence with string parameters
func (s *Service) SendChatPresenceRaw(ctx context.Context, sessionId, phone, state, media string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	var chatPresence types.ChatPresence
	switch state {
	case "composing":
		chatPresence = types.ChatPresenceComposing
	default:
		chatPresence = types.ChatPresencePaused
	}

	var chatMedia types.ChatPresenceMedia
	switch media {
	case "audio":
		chatMedia = types.ChatPresenceMediaAudio
	default:
		chatMedia = types.ChatPresenceMediaText
	}

	return client.SendChatPresence(ctx, jid, chatPresence, chatMedia)
}

// SetDisappearingTimer sets disappearing messages timer for a chat
func (s *Service) SetDisappearingTimer(ctx context.Context, sessionId, phone string, timer time.Duration) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	return client.SetDisappearingTimer(ctx, jid, timer, time.Now())
}

// RequestHistorySync sends a history sync request
func (s *Service) RequestHistorySync(ctx context.Context, sessionId string, count int) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	if count <= 0 {
		count = 100
	}

	msg := client.BuildHistorySyncRequest(nil, count)
	ownJID := *client.Store.ID
	return client.SendMessage(ctx, ownJID, msg)
}

// RequestUnavailableMessage requests an unavailable message from the phone
func (s *Service) RequestUnavailableMessage(ctx context.Context, sessionId, chatJID, senderJID, messageID string) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	chat, err := parseJID(chatJID)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid chat JID: %w", err)
	}

	sender := types.EmptyJID
	if senderJID != "" {
		sender, err = parseJID(senderJID)
		if err != nil {
			return whatsmeow.SendResponse{}, fmt.Errorf("invalid sender JID: %w", err)
		}
	}

	msg := client.BuildUnavailableMessageRequest(chat, sender, messageID)
	ownJID := *client.Store.ID
	return client.SendMessage(ctx, ownJID, msg)
}
