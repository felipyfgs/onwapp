package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"strconv"
	"strings"
	"time"

	"onwapp/internal/integrations/chatwoot/core"
	"onwapp/internal/integrations/chatwoot/util"
	"onwapp/internal/logger"
)

type Client struct {
	baseURL    string
	token      string
	accountID  int
	httpClient *http.Client
}

func NewClient(baseURL, token string, accountID int) *Client {
	baseURL = strings.TrimSuffix(baseURL, "/")
	return &Client{
		baseURL:   baseURL,
		token:     token,
		accountID: accountID,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) buildURL(endpoint string) string {
	return fmt.Sprintf("%s/api/v1/accounts/%d%s", c.baseURL, c.accountID, endpoint)
}

func (c *Client) doRequest(ctx context.Context, method, endpoint string, body interface{}) ([]byte, error) {
	var bodyReader io.Reader
	var jsonData []byte
	if body != nil {
		var err error
		jsonData, err = json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.buildURL(endpoint), bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api_access_token", c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		logger.Chatwoot().Error().
			Int("status", resp.StatusCode).
			Str("endpoint", endpoint).
			Str("response", string(respBody)).
			Msg("Chatwoot API error")
		return nil, fmt.Errorf("chatwoot API error: status %d, body: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

func (c *Client) doRequestSilent404(ctx context.Context, method, endpoint string, body interface{}) ([]byte, error) {
	var bodyReader io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.buildURL(endpoint), bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api_access_token", c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		respStr := string(respBody)
		shouldLog := resp.StatusCode != 404 &&
			!(resp.StatusCode == 422 && strings.Contains(respStr, "Phone number has already been taken"))
		if shouldLog {
			logger.Chatwoot().Error().
				Int("status", resp.StatusCode).
				Str("endpoint", endpoint).
				Str("response", respStr).
				Msg("Chatwoot API error")
		}
		return nil, fmt.Errorf("chatwoot API error: status %d, body: %s", resp.StatusCode, respStr)
	}

	return respBody, nil
}

// ValidationResult represents the result of Chatwoot credential validation
type ValidationResult struct {
	Valid             bool          `json:"valid"`
	TokenValid        bool          `json:"tokenValid"`
	AccountValid      bool          `json:"accountValid"`
	UserID            int           `json:"userId,omitempty"`
	UserName          string        `json:"userName,omitempty"`
	UserEmail         string        `json:"userEmail,omitempty"`
	UserRole          string        `json:"userRole,omitempty"`
	AccountName       string        `json:"accountName,omitempty"`
	AvailableAccounts []AccountInfo `json:"availableAccounts,omitempty"`
	Error             string        `json:"error,omitempty"`
	ErrorCode         string        `json:"errorCode,omitempty"`
}

type AccountInfo struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

type ProfileResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AccountID int    `json:"account_id"`
	Role      string `json:"role"`
	Accounts  []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
		Role string `json:"role"`
	} `json:"accounts"`
}

func (c *Client) ValidateCredentials(ctx context.Context) (*ValidationResult, error) {
	result := &ValidationResult{
		Valid:        false,
		TokenValid:   false,
		AccountValid: false,
	}

	profileURL := fmt.Sprintf("%s/api/v1/profile", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, profileURL, nil)
	if err != nil {
		result.Error = "Erro ao criar requisição"
		result.ErrorCode = "REQUEST_ERROR"
		return result, nil
	}
	req.Header.Set("api_access_token", c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		result.Error = "Não foi possível conectar ao Chatwoot. Verifique a URL."
		result.ErrorCode = "CONNECTION_ERROR"
		return result, nil
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		result.Error = "Token inválido ou expirado"
		result.ErrorCode = "INVALID_TOKEN"
		return result, nil
	}

	if resp.StatusCode != 200 {
		result.Error = fmt.Sprintf("Erro ao validar token: status %d", resp.StatusCode)
		result.ErrorCode = "TOKEN_ERROR"
		return result, nil
	}

	var profile ProfileResponse
	if err := json.Unmarshal(body, &profile); err != nil {
		result.Error = "Resposta inválida do Chatwoot"
		result.ErrorCode = "INVALID_RESPONSE"
		return result, nil
	}

	result.TokenValid = true
	result.UserID = profile.ID
	result.UserName = profile.Name
	result.UserEmail = profile.Email
	result.UserRole = profile.Role

	for _, acc := range profile.Accounts {
		result.AvailableAccounts = append(result.AvailableAccounts, AccountInfo{
			ID:   acc.ID,
			Name: acc.Name,
			Role: acc.Role,
		})
	}

	hasAccountAccess := false
	for _, acc := range profile.Accounts {
		if acc.ID == c.accountID {
			hasAccountAccess = true
			result.AccountName = acc.Name
			result.AccountValid = true
			break
		}
	}

	if !hasAccountAccess {
		if len(profile.Accounts) == 0 {
			result.Error = "O token não tem acesso a nenhuma conta"
			result.ErrorCode = "NO_ACCOUNTS"
		} else if len(profile.Accounts) == 1 {
			result.Error = fmt.Sprintf("Account ID incorreto. Use o ID %d (conta: %s)",
				profile.Accounts[0].ID, profile.Accounts[0].Name)
			result.ErrorCode = "WRONG_ACCOUNT"
		} else {
			accountList := ""
			for i, acc := range profile.Accounts {
				if i > 0 {
					accountList += ", "
				}
				accountList += fmt.Sprintf("%d (%s)", acc.ID, acc.Name)
			}
			result.Error = fmt.Sprintf("Account ID %d não encontrado. Contas disponíveis: %s",
				c.accountID, accountList)
			result.ErrorCode = "WRONG_ACCOUNT"
		}
		return result, nil
	}

	_, err = c.ListInboxes(ctx)
	if err != nil {
		result.Error = "Token não tem permissão para gerenciar inboxes nesta conta"
		result.ErrorCode = "NO_INBOX_PERMISSION"
		return result, nil
	}

	result.Valid = true
	return result, nil
}

func (c *Client) ListInboxes(ctx context.Context) ([]core.Inbox, error) {
	data, err := c.doRequest(ctx, http.MethodGet, "/inboxes", nil)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload []core.Inbox `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse inboxes response: %w", err)
	}

	return result.Payload, nil
}

func (c *Client) GetInbox(ctx context.Context, inboxID int) (*core.Inbox, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/inboxes/%d", inboxID), nil)
	if err != nil {
		return nil, err
	}

	var inbox core.Inbox
	if err := json.Unmarshal(data, &inbox); err != nil {
		return nil, fmt.Errorf("failed to parse inbox response: %w", err)
	}

	return &inbox, nil
}

func (c *Client) CreateInboxWithOptions(ctx context.Context, name, webhookURL string, autoReopen bool) (*core.Inbox, error) {
	body := map[string]interface{}{
		"name":                          name,
		"lock_to_single_conversation":   autoReopen,
		"allow_messages_after_resolved": autoReopen,
		"channel": map[string]interface{}{
			"type":        "api",
			"webhook_url": webhookURL,
		},
	}

	data, err := c.doRequest(ctx, http.MethodPost, "/inboxes", body)
	if err != nil {
		return nil, err
	}

	var inbox core.Inbox
	if err := json.Unmarshal(data, &inbox); err != nil {
		return nil, fmt.Errorf("failed to parse create inbox response: %w", err)
	}

	return &inbox, nil
}

func (c *Client) UpdateInboxConversationSettings(ctx context.Context, inboxID int, autoReopen bool) (*core.Inbox, error) {
	body := map[string]interface{}{
		"lock_to_single_conversation":   autoReopen,
		"allow_messages_after_resolved": autoReopen,
	}

	data, err := c.doRequest(ctx, http.MethodPatch, fmt.Sprintf("/inboxes/%d", inboxID), body)
	if err != nil {
		return nil, err
	}

	var inbox core.Inbox
	if err := json.Unmarshal(data, &inbox); err != nil {
		return nil, fmt.Errorf("failed to parse update inbox response: %w", err)
	}

	return &inbox, nil
}

func (c *Client) UpdateInboxWebhook(ctx context.Context, inboxID int, webhookURL string) (*core.Inbox, error) {
	body := map[string]interface{}{
		"channel": map[string]interface{}{
			"webhook_url": webhookURL,
		},
	}

	data, err := c.doRequest(ctx, http.MethodPatch, fmt.Sprintf("/inboxes/%d", inboxID), body)
	if err != nil {
		return nil, err
	}

	var inbox core.Inbox
	if err := json.Unmarshal(data, &inbox); err != nil {
		return nil, fmt.Errorf("failed to parse update inbox response: %w", err)
	}

	return &inbox, nil
}

func (c *Client) GetInboxByName(ctx context.Context, name string) (*core.Inbox, error) {
	inboxes, err := c.ListInboxes(ctx)
	if err != nil {
		return nil, err
	}

	for _, inbox := range inboxes {
		if inbox.Name == name {
			return &inbox, nil
		}
	}

	return nil, nil
}

func (c *Client) GetOrCreateInboxWithOptions(ctx context.Context, name, webhookURL string, autoReopen bool) (*core.Inbox, error) {
	inbox, err := c.GetInboxByName(ctx, name)
	if err != nil {
		return nil, err
	}

	if inbox != nil {
		_, err := c.UpdateInboxConversationSettings(ctx, inbox.ID, autoReopen)
		if err != nil {
			logger.Chatwoot().Warn().Err(err).Int("inboxId", inbox.ID).Bool("autoReopen", autoReopen).Msg("Chatwoot: failed to update inbox conversation settings")
		}
		return inbox, nil
	}

	return c.CreateInboxWithOptions(ctx, name, webhookURL, autoReopen)
}

func (c *Client) FindContactByPhone(ctx context.Context, phone string) (*core.Contact, error) {
	filterPayload := map[string]interface{}{
		"payload": []map[string]interface{}{
			{
				"attribute_key":   "phone_number",
				"filter_operator": "equal_to",
				"values":          []string{phone},
			},
		},
	}

	data, err := c.doRequest(ctx, http.MethodPost, "/contacts/filter", filterPayload)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload []core.Contact `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse contacts response: %w", err)
	}

	if len(result.Payload) == 0 {
		return nil, nil
	}

	return &result.Payload[0], nil
}

func (c *Client) FindContactByPhoneWithMerge(ctx context.Context, phone string, mergeBrPhones bool) (*core.Contact, error) {
	contact, err := c.FindContactByPhone(ctx, phone)
	if err != nil {
		return nil, err
	}
	if contact != nil {
		return contact, nil
	}

	if !mergeBrPhones || !strings.HasPrefix(phone, "+55") {
		return nil, nil
	}

	altPhone := util.GetAlternateBrazilianNumber(phone)
	if altPhone == "" {
		return nil, nil
	}

	altContact, err := c.FindContactByPhone(ctx, altPhone)
	if err != nil {
		return nil, err
	}

	return altContact, nil
}

func (c *Client) FindContactWithBrazilianOR(ctx context.Context, phone string) ([]core.Contact, error) {
	phones := util.GetBrazilianPhoneVariants(phone)

	payload := make([]map[string]interface{}, 0, len(phones))
	for i, p := range phones {
		filter := map[string]interface{}{
			"attribute_key":   "phone_number",
			"filter_operator": "equal_to",
			"values":          []string{strings.TrimPrefix(p, "+")},
		}
		if i < len(phones)-1 {
			filter["query_operator"] = "OR"
		}
		payload = append(payload, filter)
	}

	filterPayload := map[string]interface{}{
		"payload": payload,
	}

	data, err := c.doRequest(ctx, http.MethodPost, "/contacts/filter", filterPayload)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload []core.Contact `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse contacts response: %w", err)
	}

	return result.Payload, nil
}

func (c *Client) SearchContactsForBrazilianMerge(ctx context.Context, phone string) ([]*core.Contact, error) {
	contacts, err := c.FindContactWithBrazilianOR(ctx, phone)
	if err != nil {
		return nil, err
	}

	var result []*core.Contact
	seen := make(map[int]bool)
	for i := range contacts {
		if !seen[contacts[i].ID] {
			seen[contacts[i].ID] = true
			result = append(result, &contacts[i])
		}
	}

	return result, nil
}

func (c *Client) FindContactByIdentifier(ctx context.Context, identifier string) (*core.Contact, error) {
	searchURL := fmt.Sprintf("/contacts/search?q=%s", url.QueryEscape(identifier))
	data, err := c.doRequest(ctx, http.MethodGet, searchURL, nil)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload []core.Contact `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse contacts response: %w", err)
	}

	for _, contact := range result.Payload {
		if contact.Identifier == identifier {
			return &contact, nil
		}
	}

	return nil, nil
}

func (c *Client) GetContact(ctx context.Context, contactID int) (*core.Contact, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/contacts/%d", contactID), nil)
	if err != nil {
		return nil, err
	}

	var contact core.Contact
	if err := json.Unmarshal(data, &contact); err != nil {
		return nil, fmt.Errorf("failed to parse contact response: %w", err)
	}

	return &contact, nil
}

type CreateContactRequest struct {
	InboxID     int               `json:"inbox_id"`
	Name        string            `json:"name,omitempty"`
	Email       string            `json:"email,omitempty"`
	PhoneNumber string            `json:"phone_number,omitempty"`
	Identifier  string            `json:"identifier,omitempty"`
	AvatarURL   string            `json:"avatar_url,omitempty"`
	CustomAttrs map[string]string `json:"custom_attributes,omitempty"`
}

func (c *Client) CreateContact(ctx context.Context, req *CreateContactRequest) (*core.Contact, error) {
	data, err := c.doRequest(ctx, http.MethodPost, "/contacts", req)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload struct {
			Contact core.Contact `json:"contact"`
		} `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		var contact core.Contact
		if err := json.Unmarshal(data, &contact); err != nil {
			return nil, fmt.Errorf("failed to parse create contact response: %w", err)
		}
		return &contact, nil
	}

	return &result.Payload.Contact, nil
}

func (c *Client) UpdateContact(ctx context.Context, contactID int, updates map[string]interface{}) (*core.Contact, error) {
	data, err := c.doRequestSilent404(ctx, http.MethodPut, fmt.Sprintf("/contacts/%d", contactID), updates)
	if err != nil {
		if strings.Contains(err.Error(), "Phone number has already been taken") {
			return nil, nil
		}
		return nil, err
	}

	var contact core.Contact
	if err := json.Unmarshal(data, &contact); err != nil {
		return nil, fmt.Errorf("failed to parse update contact response: %w", err)
	}

	return &contact, nil
}

func (c *Client) UpdateContactSilent404(ctx context.Context, contactID int, updates map[string]interface{}) (*core.Contact, error) {
	data, err := c.doRequestSilent404(ctx, http.MethodPut, fmt.Sprintf("/contacts/%d", contactID), updates)
	if err != nil {
		if strings.Contains(err.Error(), "Phone number has already been taken") {
			return nil, nil
		}
		return nil, err
	}

	var contact core.Contact
	if err := json.Unmarshal(data, &contact); err != nil {
		return nil, fmt.Errorf("failed to parse update contact response: %w", err)
	}

	return &contact, nil
}

func (c *Client) ListContactConversations(ctx context.Context, contactID int) ([]core.Conversation, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/contacts/%d/conversations", contactID), nil)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload []core.Conversation `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse conversations response: %w", err)
	}

	return result.Payload, nil
}

func (c *Client) MergeContacts(ctx context.Context, baseContactID, mergeContactID int) error {
	body := map[string]interface{}{
		"base_contact_id":   baseContactID,
		"mergee_contact_id": mergeContactID,
	}

	_, err := c.doRequest(ctx, http.MethodPost, "/actions/contact_merge", body)
	return err
}

func (c *Client) GetOrCreateContact(ctx context.Context, inboxID int, phoneNumber, identifier, name, avatarURL string, isGroup bool) (*core.Contact, error) {
	return c.GetOrCreateContactWithMerge(ctx, inboxID, phoneNumber, identifier, name, avatarURL, isGroup, false)
}

func (c *Client) GetOrCreateContactWithMerge(ctx context.Context, inboxID int, phoneNumber, identifier, name, avatarURL string, isGroup bool, mergeBrPhones bool) (*core.Contact, error) {
	var contact *core.Contact
	var err error

	if isGroup {
		contact, err = c.FindContactByIdentifier(ctx, identifier)
	} else {
		phone := "+" + phoneNumber

		if mergeBrPhones && strings.HasPrefix(phone, "+55") {
			contacts, searchErr := c.SearchContactsForBrazilianMerge(ctx, phone)
			if searchErr != nil {
				return nil, searchErr
			}

			if len(contacts) == 2 {
				baseContact := contacts[0]
				mergeContact := contacts[1]
				if len(contacts[1].PhoneNumber) == 14 {
					baseContact = contacts[1]
					mergeContact = contacts[0]
				}
				if mergeErr := c.MergeContacts(ctx, baseContact.ID, mergeContact.ID); mergeErr != nil {
					logger.Chatwoot().Warn().Err(mergeErr).Msg("Chatwoot: failed to merge Brazilian contacts")
				} else {
					logger.Chatwoot().Info().
						Int("baseContactId", baseContact.ID).
						Int("mergeContactId", mergeContact.ID).
						Msg("Chatwoot: merged Brazilian contacts")
				}
				contact = baseContact
			} else if len(contacts) == 1 {
				contact = contacts[0]
			}
		} else {
			contact, err = c.FindContactByPhone(ctx, phone)
		}

		if err == nil && contact == nil && identifier != "" {
			contact, err = c.FindContactByIdentifier(ctx, identifier)
		}
	}

	if err != nil {
		return nil, err
	}

	if contact != nil {
		if !isGroup && contact.Identifier != identifier && identifier != "" {
			updates := map[string]interface{}{
				"identifier": identifier,
			}
			if phoneNumber != "" {
				updates["phone_number"] = "+" + phoneNumber
			}
			updatedContact, updateErr := c.UpdateContact(ctx, contact.ID, updates)
			if updateErr != nil {
				logger.Chatwoot().Debug().Err(updateErr).
					Int("contactId", contact.ID).
					Str("oldIdentifier", contact.Identifier).
					Str("newIdentifier", identifier).
					Msg("Chatwoot: failed to update contact identifier")
			} else if updatedContact != nil {
				logger.Chatwoot().Debug().
					Int("contactId", contact.ID).
					Str("oldIdentifier", contact.Identifier).
					Str("newIdentifier", identifier).
					Msg("Chatwoot: updated contact identifier")
				contact = updatedContact
			}
		}
		return contact, nil
	}

	req := &CreateContactRequest{
		InboxID:    inboxID,
		Name:       name,
		Identifier: identifier,
	}

	if !isGroup && phoneNumber != "" {
		req.PhoneNumber = "+" + phoneNumber
	}

	if avatarURL != "" {
		req.AvatarURL = avatarURL
	}

	return c.CreateContact(ctx, req)
}

func (c *Client) GetConversation(ctx context.Context, conversationID int) (*core.Conversation, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/conversations/%d", conversationID), nil)
	if err != nil {
		return nil, err
	}

	var conv core.Conversation
	if err := json.Unmarshal(data, &conv); err != nil {
		return nil, fmt.Errorf("failed to parse conversation response: %w", err)
	}

	return &conv, nil
}

type CreateConversationRequest struct {
	SourceID   string `json:"source_id,omitempty"`
	InboxID    string `json:"inbox_id"`
	ContactID  string `json:"contact_id"`
	Status     string `json:"status,omitempty"`
	AssigneeID int    `json:"assignee_id,omitempty"`
}

func (c *Client) CreateConversation(ctx context.Context, req *CreateConversationRequest) (*core.Conversation, error) {
	data, err := c.doRequest(ctx, http.MethodPost, "/conversations", req)
	if err != nil {
		return nil, err
	}

	var conv core.Conversation
	if err := json.Unmarshal(data, &conv); err != nil {
		return nil, fmt.Errorf("failed to parse create conversation response: %w", err)
	}

	return &conv, nil
}

func (c *Client) ToggleConversationStatus(ctx context.Context, conversationID int, status string) (*core.Conversation, error) {
	body := map[string]interface{}{
		"status": status,
	}

	data, err := c.doRequest(ctx, http.MethodPost, fmt.Sprintf("/conversations/%d/toggle_status", conversationID), body)
	if err != nil {
		return nil, err
	}

	var conv core.Conversation
	if err := json.Unmarshal(data, &conv); err != nil {
		return nil, fmt.Errorf("failed to parse toggle status response: %w", err)
	}

	return &conv, nil
}

type ConversationResult struct {
	Conversation *core.Conversation
	WasReopened  bool
	WasCreated   bool
}

func (c *Client) GetOrCreateConversation(ctx context.Context, contactID, inboxID int, status string, autoReopen bool) (*core.Conversation, error) {
	result, err := c.GetOrCreateConversationWithInfo(ctx, contactID, inboxID, status, autoReopen)
	if err != nil {
		return nil, err
	}
	return result.Conversation, nil
}

func (c *Client) GetOrCreateConversationWithInfo(ctx context.Context, contactID, inboxID int, status string, autoReopen bool) (*ConversationResult, error) {
	conversations, err := c.ListContactConversations(ctx, contactID)
	if err != nil {
		return nil, err
	}

	for _, conv := range conversations {
		if conv.InboxID != inboxID {
			continue
		}

		if autoReopen {
			return &ConversationResult{Conversation: &conv, WasReopened: false}, nil
		}

		if conv.Status != "resolved" {
			return &ConversationResult{Conversation: &conv, WasReopened: false}, nil
		}
	}

	req := &CreateConversationRequest{
		InboxID:   strconv.Itoa(inboxID),
		ContactID: strconv.Itoa(contactID),
		Status:    status,
	}

	newConv, err := c.CreateConversation(ctx, req)
	if err != nil {
		return nil, err
	}

	if newConv == nil || newConv.ID == 0 {
		return nil, fmt.Errorf("failed to create conversation: received invalid conversation ID")
	}

	return &ConversationResult{Conversation: newConv, WasCreated: true}, nil
}

func (c *Client) GetConversationWithContactInbox(ctx context.Context, conversationID int) (*core.Conversation, string, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/conversations/%d", conversationID), nil)
	if err != nil {
		return nil, "", err
	}

	var result struct {
		core.Conversation
		LastNonActivityMessage *struct {
			Conversation *struct {
				ContactInbox *struct {
					SourceID string `json:"source_id"`
				} `json:"contact_inbox"`
			} `json:"conversation"`
		} `json:"last_non_activity_message"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, "", fmt.Errorf("failed to parse conversation response: %w", err)
	}

	sourceID := ""
	if result.LastNonActivityMessage != nil &&
		result.LastNonActivityMessage.Conversation != nil &&
		result.LastNonActivityMessage.Conversation.ContactInbox != nil {
		sourceID = result.LastNonActivityMessage.Conversation.ContactInbox.SourceID
	}

	return &result.Conversation, sourceID, nil
}

type CreateMessageRequest struct {
	Content           string                 `json:"content,omitempty"`
	MessageType       string                 `json:"message_type"`
	Private           bool                   `json:"private,omitempty"`
	ContentAttributes map[string]interface{} `json:"content_attributes,omitempty"`
	SourceID          string                 `json:"source_id,omitempty"`
	CreatedAt         *time.Time             `json:"created_at,omitempty"`
}

func (c *Client) CreateMessage(ctx context.Context, conversationID int, req *CreateMessageRequest) (*core.Message, error) {
	endpoint := fmt.Sprintf("/conversations/%d/messages", conversationID)
	data, err := c.doRequest(ctx, http.MethodPost, endpoint, req)
	if err != nil {
		return nil, err
	}

	var msg core.Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("failed to parse create message response: %w", err)
	}

	return &msg, nil
}

func (c *Client) DeleteMessage(ctx context.Context, conversationID, messageID int) error {
	endpoint := fmt.Sprintf("/conversations/%d/messages/%d", conversationID, messageID)
	_, err := c.doRequest(ctx, http.MethodDelete, endpoint, nil)
	return err
}

func (c *Client) CreateMessageWithAttachment(ctx context.Context, conversationID int, content, messageType string, attachment io.Reader, filename string, contentAttributes map[string]interface{}) (*core.Message, error) {
	return c.CreateMessageWithAttachmentAndMime(ctx, conversationID, content, messageType, attachment, filename, "", contentAttributes)
}

func (c *Client) CreateMessageWithAttachmentAndMime(ctx context.Context, conversationID int, content, messageType string, attachment io.Reader, filename, mimeType string, contentAttributes map[string]interface{}) (*core.Message, error) {
	return c.CreateMessageWithAttachmentAndMimeAndTime(ctx, conversationID, content, messageType, attachment, filename, mimeType, contentAttributes, nil)
}

func (c *Client) CreateMessageWithAttachmentAndMimeAndTime(ctx context.Context, conversationID int, content, messageType string, attachment io.Reader, filename, mimeType string, contentAttributes map[string]interface{}, createdAt *time.Time) (*core.Message, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	if content != "" {
		_ = writer.WriteField("content", content)
	}
	_ = writer.WriteField("message_type", messageType)

	if createdAt != nil {
		_ = writer.WriteField("created_at", createdAt.Format(time.RFC3339))
	}

	if contentAttributes != nil {
		attrsJSON, err := json.Marshal(contentAttributes)
		if err == nil {
			_ = writer.WriteField("content_attributes", string(attrsJSON))
		}
	}

	var part io.Writer
	var err error
	if mimeType != "" {
		h := make(textproto.MIMEHeader)
		h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="attachments[]"; filename="%s"`, filename))
		h.Set("Content-Type", mimeType)
		part, err = writer.CreatePart(h)
	} else {
		part, err = writer.CreateFormFile("attachments[]", filename)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, copyErr := io.Copy(part, attachment); copyErr != nil {
		return nil, fmt.Errorf("failed to copy attachment: %w", copyErr)
	}

	writer.Close()

	endpoint := c.buildURL(fmt.Sprintf("/conversations/%d/messages", conversationID))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("api_access_token", c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("chatwoot API error: status %d", resp.StatusCode)
	}

	var msg core.Message
	if err := json.Unmarshal(respBody, &msg); err != nil {
		return nil, fmt.Errorf("failed to parse message response: %w", err)
	}

	return &msg, nil
}

type AttachmentUploadRequest struct {
	ConversationID    int
	Content           string
	MessageType       string
	Attachment        io.Reader
	Filename          string
	MimeType          string
	ContentAttributes map[string]interface{}
	Timestamp         *time.Time
	SourceID          string
}

func (c *Client) CreateMessageWithAttachmentFull(ctx context.Context, req AttachmentUploadRequest) (*core.Message, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	if req.Content != "" {
		_ = writer.WriteField("content", req.Content)
	}

	messageType := req.MessageType
	if messageType == "" {
		messageType = "incoming"
	}
	_ = writer.WriteField("message_type", messageType)

	if req.Timestamp != nil {
		_ = writer.WriteField("created_at", req.Timestamp.Format(time.RFC3339))
	}

	if req.SourceID != "" {
		_ = writer.WriteField("source_id", req.SourceID)
	}

	if req.ContentAttributes != nil {
		attrsJSON, err := json.Marshal(req.ContentAttributes)
		if err == nil {
			_ = writer.WriteField("content_attributes", string(attrsJSON))
		}
	}

	var part io.Writer
	var err error
	if req.MimeType != "" {
		h := make(textproto.MIMEHeader)
		h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="attachments[]"; filename="%s"`, req.Filename))
		h.Set("Content-Type", req.MimeType)
		part, err = writer.CreatePart(h)
	} else {
		part, err = writer.CreateFormFile("attachments[]", req.Filename)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, copyErr := io.Copy(part, req.Attachment); copyErr != nil {
		return nil, fmt.Errorf("failed to copy attachment: %w", copyErr)
	}

	writer.Close()

	endpoint := c.buildURL(fmt.Sprintf("/conversations/%d/messages", req.ConversationID))
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", writer.FormDataContentType())
	httpReq.Header.Set("api_access_token", c.token)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		logger.Chatwoot().Error().
			Int("status", resp.StatusCode).
			Str("response", string(respBody)).
			Msg("Chatwoot: attachment upload failed")
		return nil, fmt.Errorf("chatwoot API error: status %d, body: %s", resp.StatusCode, string(respBody))
	}

	var msg core.Message
	if err := json.Unmarshal(respBody, &msg); err != nil {
		return nil, fmt.Errorf("failed to parse message response: %w", err)
	}

	return &msg, nil
}

func (c *Client) UpdateLastSeen(ctx context.Context, inboxIdentifier, contactSourceID string, conversationID int) error {
	if inboxIdentifier == "" || contactSourceID == "" {
		return fmt.Errorf("inbox_identifier and contact_source_id are required")
	}

	url := fmt.Sprintf("%s/public/api/v1/inboxes/%s/contacts/%s/conversations/%d/update_last_seen",
		c.baseURL, inboxIdentifier, contactSourceID, conversationID)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("chatwoot public API error: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}
