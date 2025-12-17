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

	"onwapp/internal/logger"
)

const (
	maxRetries = 3
	baseDelay  = 1 * time.Second
	timeout    = 10 * time.Second
)

type ChatwootInfo struct {
	Account        int `json:"chatwootAccount,omitempty"`
	InboxID        int `json:"chatwootInboxId,omitempty"`
	ConversationID int `json:"chatwootConversationId,omitempty"`
	MessageID      int `json:"chatwootMessageId,omitempty"`
}

type ChatwootProvider interface {
	GetChatwootInfo(ctx context.Context, sessionID string) *ChatwootInfo
	GetChatwootInfoForMessage(ctx context.Context, sessionID, msgID string) *ChatwootInfo
}

type Service struct {
	repo             *Repository
	httpClient       *http.Client
	chatwootProvider ChatwootProvider
}

func NewService(repo *Repository) *Service {
	return &Service{
		repo: repo,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

func (s *Service) SetChatwootProvider(provider ChatwootProvider) {
	s.chatwootProvider = provider
}

func (s *Service) Send(ctx context.Context, sessionID, sessionId, event string, rawEvent interface{}) {
	s.SendWithChatwoot(ctx, sessionID, sessionId, event, rawEvent, nil)
}

func (s *Service) SendWithPreserializedJSON(ctx context.Context, sessionID, sessionId, event string, eventJSON []byte, cwInfo *ChatwootInfo) {
	wh, err := s.repo.GetEnabledBySession(ctx, sessionID)
	if err != nil {
		logger.Chatwoot().Error().Err(err).Str("sessionId", sessionID).Msg("Failed to get webhook")
		return
	}

	if wh == nil || wh.URL == "" {
		return
	}

	if !s.shouldSendEvent(wh.Events, event) {
		return
	}

	var payload map[string]interface{}
	if len(eventJSON) > 0 {
		if unmarshalErr := json.Unmarshal(eventJSON, &payload); unmarshalErr != nil {
			payload = make(map[string]interface{})
		}
	} else {
		payload = make(map[string]interface{})
	}

	payload["event"] = event
	payload["sessionId"] = sessionID
	payload["sessionId"] = sessionId

	if cwInfo != nil {
		if cwInfo.Account > 0 {
			payload["chatwootAccount"] = cwInfo.Account
		}
		if cwInfo.InboxID > 0 {
			payload["chatwootInboxId"] = cwInfo.InboxID
		}
		if cwInfo.ConversationID > 0 {
			payload["chatwootConversationId"] = cwInfo.ConversationID
		}
		if cwInfo.MessageID > 0 {
			payload["chatwootMessageId"] = cwInfo.MessageID
		}
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		logger.Chatwoot().Error().Err(err).Msg("Failed to marshal webhook payload")
		return
	}

	go s.sendWebhook(*wh, jsonPayload)
}

func (s *Service) SendWithChatwoot(ctx context.Context, sessionID, sessionId, event string, rawEvent interface{}, cwInfo *ChatwootInfo) {
	wh, err := s.repo.GetEnabledBySession(ctx, sessionID)
	if err != nil {
		logger.Chatwoot().Error().Err(err).Str("sessionId", sessionID).Msg("Failed to get webhook")
		return
	}

	if wh == nil || wh.URL == "" {
		return
	}

	if !s.shouldSendEvent(wh.Events, event) {
		return
	}

	payload := make(map[string]interface{})
	payload["event"] = event
	payload["sessionId"] = sessionID
	payload["sessionId"] = sessionId

	if cwInfo != nil {
		if cwInfo.Account > 0 {
			payload["chatwootAccount"] = cwInfo.Account
		}
		if cwInfo.InboxID > 0 {
			payload["chatwootInboxId"] = cwInfo.InboxID
		}
		if cwInfo.ConversationID > 0 {
			payload["chatwootConversationId"] = cwInfo.ConversationID
		}
		if cwInfo.MessageID > 0 {
			payload["chatwootMessageId"] = cwInfo.MessageID
		}
	} else if s.chatwootProvider != nil {
		msgID := extractMsgIDFromEvent(rawEvent)
		if msgID != "" {
			if providerInfo := s.chatwootProvider.GetChatwootInfoForMessage(ctx, sessionID, msgID); providerInfo != nil {
				if providerInfo.Account > 0 {
					payload["chatwootAccount"] = providerInfo.Account
				}
				if providerInfo.InboxID > 0 {
					payload["chatwootInboxId"] = providerInfo.InboxID
				}
				if providerInfo.ConversationID > 0 {
					payload["chatwootConversationId"] = providerInfo.ConversationID
				}
				if providerInfo.MessageID > 0 {
					payload["chatwootMessageId"] = providerInfo.MessageID
				}
			}
		} else {
			if providerInfo := s.chatwootProvider.GetChatwootInfo(ctx, sessionID); providerInfo != nil {
				if providerInfo.Account > 0 {
					payload["chatwootAccount"] = providerInfo.Account
				}
				if providerInfo.InboxID > 0 {
					payload["chatwootInboxId"] = providerInfo.InboxID
				}
			}
		}
	}

	if rawEvent != nil {
		rawEventJSON, marshalErr := json.Marshal(rawEvent)
		if marshalErr == nil {
			var eventMap map[string]interface{}
			if json.Unmarshal(rawEventJSON, &eventMap) == nil {
				for k, v := range eventMap {
					payload[k] = v
				}
			}
		}
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		logger.Chatwoot().Error().Err(err).Msg("Failed to marshal webhook payload")
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
			logger.Chatwoot().Debug().Str("url", wh.URL).Int("attempt", attempt+1).Msg("Retrying webhook")
		}

		ctx, cancel := context.WithTimeout(context.Background(), timeout)
		req, err := http.NewRequestWithContext(ctx, "POST", wh.URL, bytes.NewReader(payload))
		if err != nil {
			cancel()
			logger.Chatwoot().Error().Err(err).Str("url", wh.URL).Msg("Failed to create webhook request")
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "OnWapp-Webhook/1.0")

		if wh.Secret != "" {
			signature := s.generateSignature(payload, wh.Secret)
			req.Header.Set("X-Webhook-Signature", signature)
		}

		resp, err := s.httpClient.Do(req)
		cancel()

		if err != nil {
			lastErr = err
			logger.Chatwoot().Warn().Err(err).Str("url", wh.URL).Int("attempt", attempt+1).Msg("Failed to send webhook")
			continue
		}
		_ = resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			logger.Chatwoot().Debug().Str("url", wh.URL).Int("status", resp.StatusCode).Msg("Webhook sent successfully")
			return
		}

		if resp.StatusCode >= 500 {
			lastErr = err
			logger.Chatwoot().Warn().Str("url", wh.URL).Int("status", resp.StatusCode).Int("attempt", attempt+1).Msg("Webhook server error, will retry")
			continue
		}

		logger.Chatwoot().Warn().Str("url", wh.URL).Int("status", resp.StatusCode).Msg("Webhook returned non-2xx status")
		return
	}

	if lastErr != nil {
		logger.Chatwoot().Error().Err(lastErr).Str("url", wh.URL).Int("maxRetries", maxRetries).Msg("Webhook failed after all retries")
	}
}

func (s *Service) generateSignature(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return "sha256=" + hex.EncodeToString(h.Sum(nil))
}

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

func (s *Service) GetBySession(ctx context.Context, sessionID string) (*Webhook, error) {
	return s.repo.GetBySession(ctx, sessionID)
}

func (s *Service) Delete(ctx context.Context, sessionID string) error {
	return s.repo.Delete(ctx, sessionID)
}

func extractMsgIDFromEvent(rawEvent interface{}) string {
	if rawEvent == nil {
		return ""
	}

	if m, ok := rawEvent.(map[string]interface{}); ok {
		if info, ok := m["Info"].(map[string]interface{}); ok {
			if id, ok := info["ID"].(string); ok {
				return id
			}
		}
	}

	type messageEvent interface {
		GetInfo() interface{}
	}
	if evt, ok := rawEvent.(messageEvent); ok {
		info := evt.GetInfo()
		if infoMap, ok := info.(map[string]interface{}); ok {
			if id, ok := infoMap["ID"].(string); ok {
				return id
			}
		}
	}

	eventJSON, err := json.Marshal(rawEvent)
	if err != nil {
		return ""
	}
	var eventMap map[string]interface{}
	if json.Unmarshal(eventJSON, &eventMap) != nil {
		return ""
	}
	if info, ok := eventMap["Info"].(map[string]interface{}); ok {
		if id, ok := info["ID"].(string); ok {
			return id
		}
	}

	return ""
}
