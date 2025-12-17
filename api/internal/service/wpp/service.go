package wpp

import (
	"fmt"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"

	"onwapp/internal/model"
	"onwapp/internal/util"
)

type SessionProvider interface {
	Get(sessionId string) (*model.Session, error)
	EmitSyntheticEvent(sessionId string, evt interface{})
}

type QuotedMessage struct {
	MessageID string
	ChatJID   string
	SenderJID string
	Content   string
	IsFromMe  bool
}

type Service struct {
	sessions SessionProvider
}

func New(sessions SessionProvider) *Service {
	return &Service{sessions: sessions}
}

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

func parseJID(phone string) (types.JID, error) {
	return util.ParseRecipientJID(phone)
}

func parseGroupJID(groupID string) (types.JID, error) {
	return util.ParseGroupJID(groupID)
}

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
