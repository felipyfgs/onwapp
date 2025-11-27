package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"zpwoot/internal/db"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

const (
	webhookMaxRetries = 3
	webhookBaseDelay  = 1 * time.Second
	webhookTimeout    = 10 * time.Second
)

type WebhookService struct {
	database   *db.Database
	httpClient *http.Client
}

func NewWebhookService(database *db.Database) *WebhookService {
	return &WebhookService{
		database: database,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// WebhookPayload represents the webhook payload sent to subscribers
type WebhookPayload struct {
	Event       string      `json:"event"`
	SessionID   string      `json:"sessionId"`
	SessionName string      `json:"sessionName"`
	Timestamp   int64       `json:"timestamp"`
	Raw         interface{} `json:"raw"`
}

func (w *WebhookService) Send(ctx context.Context, sessionID, sessionName, event string, rawEvent interface{}) {
	wh, err := w.database.Webhooks.GetEnabledBySession(ctx, sessionID)
	if err != nil {
		logger.Error().Err(err).Str("sessionId", sessionID).Msg("Failed to get webhook")
		return
	}

	if wh == nil || wh.URL == "" {
		return
	}

	if !w.shouldSendEvent(wh.Events, event) {
		return
	}

	payload := WebhookPayload{
		Event:       event,
		SessionID:   sessionID,
		SessionName: sessionName,
		Timestamp:   time.Now().Unix(),
		Raw:         rawEvent,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to marshal webhook payload")
		return
	}

	go w.sendWebhook(*wh, jsonPayload)
}

func (w *WebhookService) shouldSendEvent(events []string, event string) bool {
	if len(events) == 0 {
		return true
	}
	for _, e := range events {
		if e == event || e == "all" || e == "*" {
			return true
		}
	}
	return false
}

func (w *WebhookService) sendWebhook(wh model.Webhook, payload []byte) {
	var lastErr error

	for attempt := 0; attempt < webhookMaxRetries; attempt++ {
		if attempt > 0 {
			delay := webhookBaseDelay * time.Duration(1<<(attempt-1)) // exponential backoff: 1s, 2s, 4s
			time.Sleep(delay)
			logger.Debug().Str("url", wh.URL).Int("attempt", attempt+1).Msg("Retrying webhook")
		}

		ctx, cancel := context.WithTimeout(context.Background(), webhookTimeout)
		req, err := http.NewRequestWithContext(ctx, "POST", wh.URL, bytes.NewReader(payload))
		if err != nil {
			cancel()
			logger.Error().Err(err).Str("url", wh.URL).Msg("Failed to create webhook request")
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "ZPWoot-Webhook/1.0")

		if wh.Secret != "" {
			signature := w.generateSignature(payload, wh.Secret)
			req.Header.Set("X-Webhook-Signature", signature)
		}

		resp, err := w.httpClient.Do(req)
		cancel()

		if err != nil {
			lastErr = err
			logger.Warn().Err(err).Str("url", wh.URL).Int("attempt", attempt+1).Msg("Failed to send webhook")
			continue
		}
		_ = resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			logger.Debug().Str("url", wh.URL).Int("status", resp.StatusCode).Msg("Webhook sent successfully")
			return
		}

		if resp.StatusCode >= 500 {
			lastErr = err
			logger.Warn().Str("url", wh.URL).Int("status", resp.StatusCode).Int("attempt", attempt+1).Msg("Webhook server error, will retry")
			continue
		}

		logger.Warn().Str("url", wh.URL).Int("status", resp.StatusCode).Msg("Webhook returned non-2xx status")
		return
	}

	if lastErr != nil {
		logger.Error().Err(lastErr).Str("url", wh.URL).Int("maxRetries", webhookMaxRetries).Msg("Webhook failed after all retries")
	}
}

func (w *WebhookService) generateSignature(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return "sha256=" + hex.EncodeToString(h.Sum(nil))
}

// CRUD operations

// Set creates or updates the webhook for a session (one webhook per session)
func (w *WebhookService) Set(ctx context.Context, sessionID string, url string, events []string, enabled bool, secret string) (*model.Webhook, error) {
	wh := &model.Webhook{
		SessionID: sessionID,
		URL:       url,
		Events:    events,
		Enabled:   enabled,
		Secret:    secret,
	}
	return w.database.Webhooks.Upsert(ctx, wh)
}

// GetBySession returns the webhook for a session (or nil if none)
func (w *WebhookService) GetBySession(ctx context.Context, sessionID string) (*model.Webhook, error) {
	return w.database.Webhooks.GetBySession(ctx, sessionID)
}

// Delete removes the webhook for a session
func (w *WebhookService) Delete(ctx context.Context, sessionID string) error {
	return w.database.Webhooks.Delete(ctx, sessionID)
}
