package webhook

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"zpwoot/internal/logger"
)

const (
	maxRetries = 3
	baseDelay  = 1 * time.Second
	timeout    = 10 * time.Second
)

// Service handles webhook business logic
type Service struct {
	repo       *Repository
	httpClient *http.Client
}

// NewService creates a new Webhook service
func NewService(repo *Repository) *Service {
	return &Service{
		repo: repo,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// Send sends a webhook notification with flat payload structure
func (s *Service) Send(ctx context.Context, sessionID, sessionName, event string, rawEvent interface{}) {
	wh, err := s.repo.GetEnabledBySession(ctx, sessionID)
	if err != nil {
		logger.Error().Err(err).Str("sessionId", sessionID).Msg("Failed to get webhook")
		return
	}

	if wh == nil || wh.URL == "" {
		return
	}

	if !s.shouldSendEvent(wh.Events, event) {
		return
	}

	// Build flat payload: metadata + event fields at same level
	payload := make(map[string]interface{})
	payload["event"] = event
	payload["sessionId"] = sessionID
	payload["sessionName"] = sessionName

	// Merge event fields into payload (flatten)
	if rawEvent != nil {
		eventJSON, err := json.Marshal(rawEvent)
		if err == nil {
			var eventMap map[string]interface{}
			if json.Unmarshal(eventJSON, &eventMap) == nil {
				for k, v := range eventMap {
					payload[k] = v
				}
			}
		}
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to marshal webhook payload")
		return
	}

	go s.sendWebhook(*wh, jsonPayload)
}

func (s *Service) shouldSendEvent(events []string, event string) bool {
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

func (s *Service) sendWebhook(wh Webhook, payload []byte) {
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			delay := baseDelay * time.Duration(1<<(attempt-1))
			time.Sleep(delay)
			logger.Debug().Str("url", wh.URL).Int("attempt", attempt+1).Msg("Retrying webhook")
		}

		ctx, cancel := context.WithTimeout(context.Background(), timeout)
		req, err := http.NewRequestWithContext(ctx, "POST", wh.URL, bytes.NewReader(payload))
		if err != nil {
			cancel()
			logger.Error().Err(err).Str("url", wh.URL).Msg("Failed to create webhook request")
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "ZPWoot-Webhook/1.0")

		if wh.Secret != "" {
			signature := s.generateSignature(payload, wh.Secret)
			req.Header.Set("X-Webhook-Signature", signature)
		}

		resp, err := s.httpClient.Do(req)
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
		logger.Error().Err(lastErr).Str("url", wh.URL).Int("maxRetries", maxRetries).Msg("Webhook failed after all retries")
	}
}

func (s *Service) generateSignature(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return "sha256=" + hex.EncodeToString(h.Sum(nil))
}

// Set creates or updates the webhook for a session (one webhook per session)
func (s *Service) Set(ctx context.Context, sessionID string, url string, events []string, enabled bool, secret string) (*Webhook, error) {
	wh := &Webhook{
		SessionID: sessionID,
		URL:       url,
		Events:    events,
		Enabled:   enabled,
		Secret:    secret,
	}
	return s.repo.Upsert(ctx, wh)
}

// GetBySession returns the webhook for a session (or nil if none)
func (s *Service) GetBySession(ctx context.Context, sessionID string) (*Webhook, error) {
	return s.repo.GetBySession(ctx, sessionID)
}

// Delete removes the webhook for a session
func (s *Service) Delete(ctx context.Context, sessionID string) error {
	return s.repo.Delete(ctx, sessionID)
}
