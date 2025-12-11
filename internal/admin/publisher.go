package admin

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/nats-io/nats.go/jetstream"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/logger"
	"onwapp/internal/model"
	"onwapp/internal/queue"
)

type Publisher struct {
	client *queue.Client
}

func NewPublisher(client *queue.Client) *Publisher {
	if client == nil {
		return nil
	}
	return &Publisher{client: client}
}

func (p *Publisher) IsConnected() bool {
	return p.client != nil && p.client.IsConnected()
}

func (p *Publisher) EnsureStream(ctx context.Context) error {
	if p == nil || p.client == nil {
		return nil
	}

	streamName := p.client.StreamName(StreamAdmin)
	streamConfig := jetstream.StreamConfig{
		Name:        streamName,
		Description: "Admin session events for real-time dashboard",
		Subjects:    []string{p.client.Subject(StreamAdmin, ">")},
		Retention:   jetstream.InterestPolicy,
		MaxAge:      1 * time.Hour,
		Storage:     jetstream.MemoryStorage,
		Replicas:    1,
	}

	_, err := p.client.JetStream().CreateOrUpdateStream(ctx, streamConfig)
	if err != nil {
		return fmt.Errorf("failed to create admin stream: %w", err)
	}

	logger.Nats().Info().Str("stream", streamName).Msg("Admin NATS stream ready")
	return nil
}

func (p *Publisher) HandleEvent(session *model.Session, evt interface{}) {
	if p == nil || !p.IsConnected() {
		return
	}

	ctx := context.Background()

	switch e := evt.(type) {
	case *events.Connected:
		p.publishConnected(ctx, session)
	case *events.Disconnected:
		p.publishDisconnected(ctx, session)
	case *events.LoggedOut:
		p.publishLoggedOut(ctx, session, e)
	case *events.QR:
		p.publishQR(ctx, session, e)
	case *events.PairSuccess:
		p.publishPairSuccess(ctx, session, e)
	case *events.PairError:
		p.publishPairError(ctx, session, e)
	case *events.ConnectFailure:
		p.publishConnectFailure(ctx, session, e)
	}
}

func (p *Publisher) publish(ctx context.Context, event *SessionEvent) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	subject := p.client.Subject(StreamAdmin, event.Event)

	_, err = p.client.JetStream().Publish(ctx, subject, data)
	if err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}

	logger.Admin().Debug().
		Str("event", event.Event).
		Str("session", event.Session).
		Str("subject", subject).
		Msg("Admin event published")

	return nil
}

func (p *Publisher) publishConnected(ctx context.Context, session *model.Session) {
	if err := p.publish(ctx, &SessionEvent{
		Event:     "session.connected",
		SessionID: session.ID,
		Session:   session.Session,
		Status:    "connected",
		Timestamp: time.Now(),
	}); err != nil {
		logger.Admin().Warn().Err(err).Str("session", session.Session).Msg("Failed to publish connected event")
	}
}

func (p *Publisher) publishDisconnected(ctx context.Context, session *model.Session) {
	if err := p.publish(ctx, &SessionEvent{
		Event:     "session.disconnected",
		SessionID: session.ID,
		Session:   session.Session,
		Status:    "disconnected",
		Timestamp: time.Now(),
	}); err != nil {
		logger.Admin().Warn().Err(err).Str("session", session.Session).Msg("Failed to publish disconnected event")
	}
}

func (p *Publisher) publishLoggedOut(ctx context.Context, session *model.Session, e *events.LoggedOut) {
	if err := p.publish(ctx, &SessionEvent{
		Event:     "session.logged_out",
		SessionID: session.ID,
		Session:   session.Session,
		Status:    "disconnected",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"reason":    e.Reason.String(),
			"onConnect": e.OnConnect,
		},
	}); err != nil {
		logger.Admin().Warn().Err(err).Str("session", session.Session).Msg("Failed to publish logged out event")
	}
}

func (p *Publisher) publishQR(ctx context.Context, session *model.Session, e *events.QR) {
	if len(e.Codes) == 0 {
		return
	}

	qrCode := e.Codes[0]
	var qrBase64 string

	png, err := qrcode.Encode(qrCode, qrcode.Medium, 256)
	if err == nil {
		qrBase64 = "data:image/png;base64," + base64.StdEncoding.EncodeToString(png)
	}

	if err := p.publish(ctx, &SessionEvent{
		Event:     "session.qr",
		SessionID: session.ID,
		Session:   session.Session,
		Status:    "connecting",
		Timestamp: time.Now(),
		Data: &QRData{
			QRCode:   qrCode,
			QRBase64: qrBase64,
		},
	}); err != nil {
		logger.Admin().Warn().Err(err).Str("session", session.Session).Msg("Failed to publish QR event")
	}
}

func (p *Publisher) publishPairSuccess(ctx context.Context, session *model.Session, e *events.PairSuccess) {
	if err := p.publish(ctx, &SessionEvent{
		Event:     "session.pair_success",
		SessionID: session.ID,
		Session:   session.Session,
		Status:    "connecting",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"deviceId":     e.ID.String(),
			"businessName": e.BusinessName,
			"platform":     e.Platform,
		},
	}); err != nil {
		logger.Admin().Warn().Err(err).Str("session", session.Session).Msg("Failed to publish pair success event")
	}
}

func (p *Publisher) publishPairError(ctx context.Context, session *model.Session, e *events.PairError) {
	if err := p.publish(ctx, &SessionEvent{
		Event:     "session.pair_error",
		SessionID: session.ID,
		Session:   session.Session,
		Status:    "disconnected",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"id":           e.ID.String(),
			"businessName": e.BusinessName,
		},
	}); err != nil {
		logger.Admin().Warn().Err(err).Str("session", session.Session).Msg("Failed to publish pair error event")
	}
}

func (p *Publisher) publishConnectFailure(ctx context.Context, session *model.Session, e *events.ConnectFailure) {
	if err := p.publish(ctx, &SessionEvent{
		Event:     "session.connect_failure",
		SessionID: session.ID,
		Session:   session.Session,
		Status:    "disconnected",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"reason":  e.Reason.String(),
			"message": e.Message,
		},
	}); err != nil {
		logger.Admin().Warn().Err(err).Str("session", session.Session).Msg("Failed to publish connect failure event")
	}
}
