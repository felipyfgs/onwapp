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

func (w *WebhookService) Send(ctx context.Context, sessionID int, event string, data interface{}) {
	webhooks, err := w.database.Webhooks.GetEnabledBySession(ctx, sessionID)
	if err != nil {
		logger.Error().Err(err).Int("sessionId", sessionID).Msg("Failed to get webhooks")
		return
	}

	if len(webhooks) == 0 {
		return
	}

	payload := map[string]interface{}{
		"event":     event,
		"sessionId": sessionID,
		"timestamp": time.Now().Unix(),
		"data":      data,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to marshal webhook payload")
		return
	}

	for _, wh := range webhooks {
		if !w.shouldSendEvent(wh.Events, event) {
			continue
		}
		go w.sendWebhook(wh, jsonPayload)
	}
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
	req, err := http.NewRequest("POST", wh.URL, bytes.NewReader(payload))
	if err != nil {
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
	if err != nil {
		logger.Warn().Err(err).Str("url", wh.URL).Msg("Failed to send webhook")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		logger.Debug().Str("url", wh.URL).Int("status", resp.StatusCode).Msg("Webhook sent successfully")
	} else {
		logger.Warn().Str("url", wh.URL).Int("status", resp.StatusCode).Msg("Webhook returned non-2xx status")
	}
}

func (w *WebhookService) generateSignature(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return "sha256=" + hex.EncodeToString(h.Sum(nil))
}

// CRUD operations

func (w *WebhookService) Create(ctx context.Context, sessionID int, url string, events []string, secret string) (int, error) {
	wh := &model.Webhook{
		SessionID: sessionID,
		URL:       url,
		Events:    events,
		Enabled:   true,
		Secret:    secret,
	}
	return w.database.Webhooks.Create(ctx, wh)
}

func (w *WebhookService) GetBySession(ctx context.Context, sessionID int) ([]model.Webhook, error) {
	return w.database.Webhooks.GetBySession(ctx, sessionID)
}

func (w *WebhookService) Update(ctx context.Context, id int, url string, events []string, enabled bool, secret string) error {
	return w.database.Webhooks.Update(ctx, id, url, events, enabled, secret)
}

func (w *WebhookService) Delete(ctx context.Context, id int) error {
	return w.database.Webhooks.Delete(ctx, id)
}
