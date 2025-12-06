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

// Client provides methods to interact with the Chatwoot API
type Client struct {
	baseURL    string
	token      string
	accountID  int
	httpClient *http.Client
}

// NewClient creates a new Chatwoot API client
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

// doRequestSilent404 is like doRequest but doesn't log 404 errors (resource not found)
// Also silences 422 errors for "Phone number has already been taken" (duplicate contact)
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
		// Don't log 404 (not found) or 422 with "Phone number has already been taken" (duplicate)
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

// =============================================================================
// INBOX OPERATIONS
// =============================================================================

// ListInboxes returns all inboxes for the account
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

// GetInbox returns an inbox by ID
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

// CreateInboxWithOptions creates a new API inbox with conversation management options
// When autoReopen is true:
//   - lock_to_single_conversation: true (one conversation per contact)
//   - allow_messages_after_resolved: true (Chatwoot auto-reopens resolved conversations)
//
// When autoReopen is false:
//   - lock_to_single_conversation: false
//   - allow_messages_after_resolved: false (new messages create new conversations)
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

// UpdateInboxConversationSettings updates conversation management settings of an inbox
// When autoReopen is true:
//   - lock_to_single_conversation: true (one conversation per contact)
//   - allow_messages_after_resolved: true (Chatwoot auto-reopens resolved conversations)
//
// When autoReopen is false:
//   - lock_to_single_conversation: false
//   - allow_messages_after_resolved: false (new messages create new conversations)
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

// UpdateInboxWebhook updates the webhook URL of an inbox
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

// GetInboxByName finds an inbox by name
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

// GetOrCreateInboxWithOptions gets an existing inbox or creates one with conversation management options
// The autoReopen parameter controls:
//   - lock_to_single_conversation: ensures one conversation per contact
//   - allow_messages_after_resolved: Chatwoot auto-reopens resolved conversations on new messages
func (c *Client) GetOrCreateInboxWithOptions(ctx context.Context, name, webhookURL string, autoReopen bool) (*core.Inbox, error) {
	inbox, err := c.GetInboxByName(ctx, name)
	if err != nil {
		return nil, err
	}

	if inbox != nil {
		// Always update inbox settings to ensure they match the current config
		_, err := c.UpdateInboxConversationSettings(ctx, inbox.ID, autoReopen)
		if err != nil {
			logger.Chatwoot().Warn().Err(err).Int("inboxId", inbox.ID).Bool("autoReopen", autoReopen).Msg("Chatwoot: failed to update inbox conversation settings")
		}
		return inbox, nil
	}

	return c.CreateInboxWithOptions(ctx, name, webhookURL, autoReopen)
}

// =============================================================================
// CONTACT OPERATIONS
// =============================================================================

// FindContactByPhone searches for a contact by phone number
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

// FindContactByPhoneWithMerge searches for a contact with Brazilian phone number merge support
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

// FindContactWithBrazilianOR searches for Brazilian contacts using OR filter
// This is more efficient as it searches both phone formats in a single API call
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

// SearchContactsForBrazilianMerge searches for both Brazilian number formats and merges if needed
// Uses single API call with OR filter for efficiency
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

// FindContactByIdentifier searches for a contact by identifier
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

// GetContact returns a contact by ID
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

// CreateContactRequest for Chatwoot API calls
type CreateContactRequest struct {
	InboxID     int               `json:"inbox_id"`
	Name        string            `json:"name,omitempty"`
	Email       string            `json:"email,omitempty"`
	PhoneNumber string            `json:"phone_number,omitempty"`
	Identifier  string            `json:"identifier,omitempty"`
	AvatarURL   string            `json:"avatar_url,omitempty"`
	CustomAttrs map[string]string `json:"custom_attributes,omitempty"`
}

// CreateContact creates a new contact
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

// UpdateContact updates a contact
// Silently ignores "Phone number has already been taken" errors (422) as these
// indicate a duplicate contact exists and the update is not necessary
func (c *Client) UpdateContact(ctx context.Context, contactID int, updates map[string]interface{}) (*core.Contact, error) {
	// Use doRequestSilent404 to avoid logging 404 and 422 duplicate phone errors
	data, err := c.doRequestSilent404(ctx, http.MethodPut, fmt.Sprintf("/contacts/%d", contactID), updates)
	if err != nil {
		// Silently ignore "Phone number has already been taken" error
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

// UpdateContactSilent404 updates a contact without logging 404 errors (deleted contacts)
// Also silently ignores "Phone number has already been taken" errors (422)
func (c *Client) UpdateContactSilent404(ctx context.Context, contactID int, updates map[string]interface{}) (*core.Contact, error) {
	data, err := c.doRequestSilent404(ctx, http.MethodPut, fmt.Sprintf("/contacts/%d", contactID), updates)
	if err != nil {
		// Silently ignore "Phone number has already been taken" error
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

// ListContactConversations lists all conversations for a contact
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

// MergeContacts merges two contacts
func (c *Client) MergeContacts(ctx context.Context, baseContactID, mergeContactID int) error {
	body := map[string]interface{}{
		"base_contact_id":   baseContactID,
		"mergee_contact_id": mergeContactID,
	}

	_, err := c.doRequest(ctx, http.MethodPost, "/actions/contact_merge", body)
	return err
}

// GetOrCreateContact gets or creates a contact
func (c *Client) GetOrCreateContact(ctx context.Context, inboxID int, phoneNumber, identifier, name, avatarURL string, isGroup bool) (*core.Contact, error) {
	return c.GetOrCreateContactWithMerge(ctx, inboxID, phoneNumber, identifier, name, avatarURL, isGroup, false)
}

// GetOrCreateContactWithMerge gets or creates a contact with optional Brazilian number merge
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
				// Auto-merge Brazilian contacts (prefer the one with 9 = 14 chars with +)
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

		// If not found by phone, also search by identifier to avoid duplicate identifier errors
		if err == nil && contact == nil && identifier != "" {
			contact, err = c.FindContactByIdentifier(ctx, identifier)
		}
	}

	if err != nil {
		return nil, err
	}

	if contact != nil {
		// Update identifier if different (for LID migration)
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

// =============================================================================
// CONVERSATION OPERATIONS
// =============================================================================

// GetConversation returns a conversation by ID
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

// CreateConversationRequest for Chatwoot API calls
type CreateConversationRequest struct {
	SourceID   string `json:"source_id,omitempty"`
	InboxID    string `json:"inbox_id"`
	ContactID  string `json:"contact_id"`
	Status     string `json:"status,omitempty"`
	AssigneeID int    `json:"assignee_id,omitempty"`
}

// CreateConversation creates a new conversation
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

// ToggleConversationStatus changes the status of a conversation
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

// ConversationResult holds the result of GetOrCreateConversation with metadata
type ConversationResult struct {
	Conversation *core.Conversation
	WasReopened  bool
	WasCreated   bool
}

// GetOrCreateConversation gets an existing conversation or creates a new one
// Note: Conversation reopening is now handled natively by Chatwoot via allow_messages_after_resolved
// inbox setting, configured when autoReopen=true in GetOrCreateInboxWithOptions
func (c *Client) GetOrCreateConversation(ctx context.Context, contactID, inboxID int, status string, autoReopen bool) (*core.Conversation, error) {
	result, err := c.GetOrCreateConversationWithInfo(ctx, contactID, inboxID, status, autoReopen)
	if err != nil {
		return nil, err
	}
	return result.Conversation, nil
}

// GetOrCreateConversationWithInfo gets an existing conversation or creates a new one, returning metadata
// Note: When autoReopen=true, the inbox is configured with allow_messages_after_resolved=true,
// which means Chatwoot automatically reopens resolved conversations when new messages arrive.
// We simply return the existing conversation and let Chatwoot handle the status management.
func (c *Client) GetOrCreateConversationWithInfo(ctx context.Context, contactID, inboxID int, status string, autoReopen bool) (*ConversationResult, error) {
	conversations, err := c.ListContactConversations(ctx, contactID)
	if err != nil {
		return nil, err
	}

	for _, conv := range conversations {
		if conv.InboxID != inboxID {
			continue
		}

		// When autoReopen=true: Chatwoot handles reopening via allow_messages_after_resolved
		// Just return the conversation (even if resolved) - Chatwoot will reopen it automatically
		if autoReopen {
			return &ConversationResult{Conversation: &conv, WasReopened: false}, nil
		}

		// When autoReopen=false: Only use non-resolved conversations
		// Resolved conversations are skipped, and a new one will be created
		if conv.Status != "resolved" {
			return &ConversationResult{Conversation: &conv, WasReopened: false}, nil
		}
	}

	// No suitable conversation found, create a new one
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

// GetConversationWithContactInbox gets a conversation with contact inbox details
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

// =============================================================================
// MESSAGE OPERATIONS
// =============================================================================

// CreateMessageRequest for Chatwoot API calls
type CreateMessageRequest struct {
	Content           string                 `json:"content,omitempty"`
	MessageType       string                 `json:"message_type"`
	Private           bool                   `json:"private,omitempty"`
	ContentAttributes map[string]interface{} `json:"content_attributes,omitempty"`
	SourceID          string                 `json:"source_id,omitempty"`
	CreatedAt         *time.Time             `json:"created_at,omitempty"`
}

// CreateMessage creates a new message in a conversation
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

// DeleteMessage deletes a message from a conversation
func (c *Client) DeleteMessage(ctx context.Context, conversationID, messageID int) error {
	endpoint := fmt.Sprintf("/conversations/%d/messages/%d", conversationID, messageID)
	_, err := c.doRequest(ctx, http.MethodDelete, endpoint, nil)
	return err
}

// CreateMessageWithAttachment creates a message with an attachment
func (c *Client) CreateMessageWithAttachment(ctx context.Context, conversationID int, content, messageType string, attachment io.Reader, filename string, contentAttributes map[string]interface{}) (*core.Message, error) {
	return c.CreateMessageWithAttachmentAndMime(ctx, conversationID, content, messageType, attachment, filename, "", contentAttributes)
}

// CreateMessageWithAttachmentAndMime creates a message with an attachment and specific MIME type
func (c *Client) CreateMessageWithAttachmentAndMime(ctx context.Context, conversationID int, content, messageType string, attachment io.Reader, filename, mimeType string, contentAttributes map[string]interface{}) (*core.Message, error) {
	return c.CreateMessageWithAttachmentAndMimeAndTime(ctx, conversationID, content, messageType, attachment, filename, mimeType, contentAttributes, nil)
}

// CreateMessageWithAttachmentAndMimeAndTime creates a message with an attachment, MIME type, and custom timestamp
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

// AttachmentUploadRequest contains all parameters for uploading a message with attachment
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

// CreateMessageWithAttachmentFull creates a message with attachment and all options including timestamp
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

// UpdateLastSeen marks a conversation as read/seen in Chatwoot using the public API
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
