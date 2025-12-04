package wpp

import (
	"context"
	"fmt"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"

	"zpwoot/internal/model"
	"zpwoot/internal/util"
)

// SessionProvider defines interface for session management
type SessionProvider interface {
	Get(sessionId string) (*model.Session, error)
	EmitSyntheticEvent(sessionId string, evt interface{})
}

// MediaSaver defines interface for saving sent media
type MediaSaver interface {
	SaveSentMedia(ctx context.Context, info *SentMediaInfo) error
}

// SentMediaInfo holds info for saving sent media
type SentMediaInfo struct {
	SessionID string
	MsgID     string
	ChatJID   string
	MediaType string
	MimeType  string
	FileName  string
	Caption   string
	FileSize  int64
	Data      []byte
}

// QuotedMessage holds information for quoting a previous message
type QuotedMessage struct {
	MessageID string
	ChatJID   string
	SenderJID string
	Content   string
	IsFromMe  bool
}

// Service handles WhatsApp operations
type Service struct {
	sessions SessionProvider
	media    MediaSaver
}

// New creates a new WhatsApp service
func New(sessions SessionProvider) *Service {
	return &Service{sessions: sessions}
}

// SetMediaSaver sets the media saver for saving sent media
func (s *Service) SetMediaSaver(saver MediaSaver) {
	s.media = saver
}

// getClient returns the WhatsApp client for a session
func (s *Service) getClient(sessionId string) (*whatsmeow.Client, error) {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return nil, err
	}
	if !session.Client.IsConnected() {
		return nil, fmt.Errorf("session %s is not connected", sessionId)
	}
	return session.Client, nil
}

// parseJID parses a phone number or JID string into a JID
func parseJID(phone string) (types.JID, error) {
	return util.ParseRecipientJID(phone)
}

// parseGroupJID parses a group ID string into a JID
func parseGroupJID(groupID string) (types.JID, error) {
	return util.ParseGroupJID(groupID)
}

// buildQuoteContext creates a ContextInfo for quoted messages
func buildQuoteContext(quoted *QuotedMessage) *waE2E.ContextInfo {
	if quoted == nil {
		return nil
	}
	ctx := &waE2E.ContextInfo{
		StanzaID:      proto.String(quoted.MessageID),
		QuotedMessage: &waE2E.Message{Conversation: proto.String("")},
	}
	if quoted.SenderJID != "" {
		ctx.Participant = proto.String(quoted.SenderJID)
	}
	return ctx
}

// emitSentEvent emits a synthetic event for messages sent via API
func (s *Service) emitSentEvent(sessionId string, resp whatsmeow.SendResponse, jid types.JID, msg *waE2E.Message) {
	session, err := s.sessions.Get(sessionId)
	if err != nil || session.Client.Store.ID == nil {
		return
	}

	evt := &events.Message{
		Info: types.MessageInfo{
			ID:        resp.ID,
			Timestamp: resp.Timestamp,
			MessageSource: types.MessageSource{
				Chat:     jid,
				Sender:   session.Client.Store.ID.ToNonAD(),
				IsFromMe: true,
				IsGroup:  jid.Server == types.GroupServer,
			},
		},
		Message: msg,
	}

	s.sessions.EmitSyntheticEvent(sessionId, evt)
}

// saveSentMediaAsync saves sent media asynchronously
func (s *Service) saveSentMediaAsync(sessionId, msgID, chatJID, mediaType, mimeType, fileName, caption string, data []byte) {
	if s.media == nil {
		return
	}

	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		info := &SentMediaInfo{
			SessionID: session.ID,
			MsgID:     msgID,
			ChatJID:   chatJID,
			MediaType: mediaType,
			MimeType:  mimeType,
			FileName:  fileName,
			Caption:   caption,
			FileSize:  int64(len(data)),
			Data:      data,
		}

		_ = s.media.SaveSentMedia(ctx, info)
	}()
}
