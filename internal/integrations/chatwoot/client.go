package chatwoot

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

	"zpwoot/internal/logger"
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
	// Ensure URL doesn't have trailing slash
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
		logger.Error().
			Int("status", resp.StatusCode).
			Str("endpoint", endpoint).
			Str("response", string(respBody)).
			Msg("Chatwoot API error")
		return nil, fmt.Errorf("chatwoot API error: status %d, body: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

// Inboxes

// ListInboxes returns all inboxes for the account
func (c *Client) ListInboxes(ctx context.Context) ([]Inbox, error) {
	data, err := c.doRequest(ctx, http.MethodGet, "/inboxes", nil)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload []Inbox `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse inboxes response: %w", err)
	}

	return result.Payload, nil
}

// GetInbox returns an inbox by ID
func (c *Client) GetInbox(ctx context.Context, inboxID int) (*Inbox, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/inboxes/%d", inboxID), nil)
	if err != nil {
		return nil, err
	}

	var inbox Inbox
	if err := json.Unmarshal(data, &inbox); err != nil {
		return nil, fmt.Errorf("failed to parse inbox response: %w", err)
	}

	return &inbox, nil
}

// CreateInbox creates a new API inbox
func (c *Client) CreateInbox(ctx context.Context, name, webhookURL string) (*Inbox, error) {
	return c.CreateInboxWithOptions(ctx, name, webhookURL, false)
}

// CreateInboxWithOptions creates a new API inbox with lock_to_single_conversation option
func (c *Client) CreateInboxWithOptions(ctx context.Context, name, webhookURL string, lockToSingleConversation bool) (*Inbox, error) {
	body := map[string]interface{}{
		"name":                        name,
		"lock_to_single_conversation": lockToSingleConversation,
		"channel": map[string]interface{}{
			"type":        "api",
			"webhook_url": webhookURL,
		},
	}

	data, err := c.doRequest(ctx, http.MethodPost, "/inboxes", body)
	if err != nil {
		return nil, err
	}

	var inbox Inbox
	if err := json.Unmarshal(data, &inbox); err != nil {
		return nil, fmt.Errorf("failed to parse create inbox response: %w", err)
	}

	return &inbox, nil
}

// UpdateInboxLockSetting updates the lock_to_single_conversation setting of an inbox
func (c *Client) UpdateInboxLockSetting(ctx context.Context, inboxID int, lockToSingleConversation bool) (*Inbox, error) {
	body := map[string]interface{}{
		"lock_to_single_conversation": lockToSingleConversation,
	}

	data, err := c.doRequest(ctx, http.MethodPatch, fmt.Sprintf("/inboxes/%d", inboxID), body)
	if err != nil {
		return nil, err
	}

	var inbox Inbox
	if err := json.Unmarshal(data, &inbox); err != nil {
		return nil, fmt.Errorf("failed to parse update inbox response: %w", err)
	}

	return &inbox, nil
}

// UpdateInboxWebhook updates the webhook URL of an inbox
func (c *Client) UpdateInboxWebhook(ctx context.Context, inboxID int, webhookURL string) (*Inbox, error) {
	body := map[string]interface{}{
		"channel": map[string]interface{}{
			"webhook_url": webhookURL,
		},
	}

	data, err := c.doRequest(ctx, http.MethodPatch, fmt.Sprintf("/inboxes/%d", inboxID), body)
	if err != nil {
		return nil, err
	}

	var inbox Inbox
	if err := json.Unmarshal(data, &inbox); err != nil {
		return nil, fmt.Errorf("failed to parse update inbox response: %w", err)
	}

	return &inbox, nil
}

// Contacts

// FindContactByPhone searches for a contact by phone number
func (c *Client) FindContactByPhone(ctx context.Context, phone string) (*Contact, error) {
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
		Payload []Contact `json:"payload"`
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
// Brazilian numbers can have 8 or 9 digits after area code, this handles both cases
func (c *Client) FindContactByPhoneWithMerge(ctx context.Context, phone string, mergeBrPhones bool) (*Contact, error) {
	// First try exact match
	contact, err := c.FindContactByPhone(ctx, phone)
	if err != nil {
		return nil, err
	}
	if contact != nil {
		return contact, nil
	}

	// If not Brazilian number or merge disabled, return nil
	if !mergeBrPhones || !strings.HasPrefix(phone, "+55") {
		return nil, nil
	}

	// Try alternate Brazilian number format (8 vs 9 digits)
	altPhone := c.getAlternateBrazilianNumber(phone)
	if altPhone == "" {
		return nil, nil
	}

	// Search for alternate number
	altContact, err := c.FindContactByPhone(ctx, altPhone)
	if err != nil {
		return nil, err
	}

	return altContact, nil
}

// getAlternateBrazilianNumber returns the alternate format for Brazilian numbers
// +55XX9XXXXXXXX (13 digits) <-> +55XXXXXXXXXX (12 digits)
func (c *Client) getAlternateBrazilianNumber(phone string) string {
	phone = strings.TrimPrefix(phone, "+")
	
	// 13 digits with 9 -> remove 9 to get 12 digits
	if len(phone) == 13 && strings.HasPrefix(phone, "55") {
		// +55 XX 9XXXX XXXX -> +55 XX XXXX XXXX
		return "+" + phone[:4] + phone[5:]
	}
	
	// 12 digits without 9 -> add 9 to get 13 digits
	if len(phone) == 12 && strings.HasPrefix(phone, "55") {
		// +55 XX XXXX XXXX -> +55 XX 9XXXX XXXX
		return "+" + phone[:4] + "9" + phone[4:]
	}
	
	return ""
}

// SearchContactsForBrazilianMerge searches for both Brazilian number formats and merges if needed
func (c *Client) SearchContactsForBrazilianMerge(ctx context.Context, phone string) ([]*Contact, error) {
	var contacts []*Contact
	
	// Search primary number
	contact1, err := c.FindContactByPhone(ctx, phone)
	if err != nil {
		return nil, err
	}
	if contact1 != nil {
		contacts = append(contacts, contact1)
	}
	
	// Search alternate number
	altPhone := c.getAlternateBrazilianNumber(phone)
	if altPhone != "" {
		contact2, err := c.FindContactByPhone(ctx, altPhone)
		if err != nil {
			return nil, err
		}
		if contact2 != nil && (contact1 == nil || contact2.ID != contact1.ID) {
			contacts = append(contacts, contact2)
		}
	}
	
	return contacts, nil
}

// FindContactByIdentifier searches for a contact by identifier
func (c *Client) FindContactByIdentifier(ctx context.Context, identifier string) (*Contact, error) {
	searchURL := fmt.Sprintf("/contacts/search?q=%s", url.QueryEscape(identifier))
	data, err := c.doRequest(ctx, http.MethodGet, searchURL, nil)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload []Contact `json:"payload"`
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
func (c *Client) GetContact(ctx context.Context, contactID int) (*Contact, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/contacts/%d", contactID), nil)
	if err != nil {
		return nil, err
	}

	var contact Contact
	if err := json.Unmarshal(data, &contact); err != nil {
		return nil, fmt.Errorf("failed to parse contact response: %w", err)
	}

	return &contact, nil
}

// CreateContact creates a new contact
func (c *Client) CreateContact(ctx context.Context, req *CreateContactRequest) (*Contact, error) {
	data, err := c.doRequest(ctx, http.MethodPost, "/contacts", req)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload struct {
			Contact Contact `json:"contact"`
		} `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		// Try direct contact parsing
		var contact Contact
		if err := json.Unmarshal(data, &contact); err != nil {
			return nil, fmt.Errorf("failed to parse create contact response: %w", err)
		}
		return &contact, nil
	}

	return &result.Payload.Contact, nil
}

// UpdateContact updates a contact
func (c *Client) UpdateContact(ctx context.Context, contactID int, updates map[string]interface{}) (*Contact, error) {
	data, err := c.doRequest(ctx, http.MethodPut, fmt.Sprintf("/contacts/%d", contactID), updates)
	if err != nil {
		return nil, err
	}

	var contact Contact
	if err := json.Unmarshal(data, &contact); err != nil {
		return nil, fmt.Errorf("failed to parse update contact response: %w", err)
	}

	return &contact, nil
}

// ListContactConversations lists all conversations for a contact
func (c *Client) ListContactConversations(ctx context.Context, contactID int) ([]Conversation, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/contacts/%d/conversations", contactID), nil)
	if err != nil {
		return nil, err
	}

	var result struct {
		Payload []Conversation `json:"payload"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse conversations response: %w", err)
	}

	return result.Payload, nil
}

// MergeContacts merges two contacts (useful for Brazilian numbers with 8/9 digits)
func (c *Client) MergeContacts(ctx context.Context, baseContactID, mergeContactID int) error {
	body := map[string]interface{}{
		"base_contact_id":   baseContactID,
		"mergee_contact_id": mergeContactID,
	}

	_, err := c.doRequest(ctx, http.MethodPost, "/actions/contact_merge", body)
	return err
}

// Conversations

// GetConversation returns a conversation by ID
func (c *Client) GetConversation(ctx context.Context, conversationID int) (*Conversation, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/conversations/%d", conversationID), nil)
	if err != nil {
		return nil, err
	}

	var conv Conversation
	if err := json.Unmarshal(data, &conv); err != nil {
		return nil, fmt.Errorf("failed to parse conversation response: %w", err)
	}

	return &conv, nil
}

// CreateConversation creates a new conversation
func (c *Client) CreateConversation(ctx context.Context, req *CreateConversationRequest) (*Conversation, error) {
	data, err := c.doRequest(ctx, http.MethodPost, "/conversations", req)
	if err != nil {
		return nil, err
	}

	var conv Conversation
	if err := json.Unmarshal(data, &conv); err != nil {
		return nil, fmt.Errorf("failed to parse create conversation response: %w", err)
	}

	return &conv, nil
}

// ToggleConversationStatus changes the status of a conversation
func (c *Client) ToggleConversationStatus(ctx context.Context, conversationID int, status string) (*Conversation, error) {
	body := map[string]interface{}{
		"status": status,
	}

	data, err := c.doRequest(ctx, http.MethodPost, fmt.Sprintf("/conversations/%d/toggle_status", conversationID), body)
	if err != nil {
		return nil, err
	}

	var conv Conversation
	if err := json.Unmarshal(data, &conv); err != nil {
		return nil, fmt.Errorf("failed to parse toggle status response: %w", err)
	}

	return &conv, nil
}

// Messages

// CreateMessage creates a new message in a conversation
func (c *Client) CreateMessage(ctx context.Context, conversationID int, req *CreateMessageRequest) (*Message, error) {
	endpoint := fmt.Sprintf("/conversations/%d/messages", conversationID)
	data, err := c.doRequest(ctx, http.MethodPost, endpoint, req)
	if err != nil {
		return nil, err
	}

	var msg Message
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
func (c *Client) CreateMessageWithAttachment(ctx context.Context, conversationID int, content, messageType string, attachment io.Reader, filename string, contentAttributes map[string]interface{}) (*Message, error) {
	return c.CreateMessageWithAttachmentAndMime(ctx, conversationID, content, messageType, attachment, filename, "", contentAttributes)
}

// CreateMessageWithAttachmentAndMime creates a message with an attachment and specific MIME type
func (c *Client) CreateMessageWithAttachmentAndMime(ctx context.Context, conversationID int, content, messageType string, attachment io.Reader, filename, mimeType string, contentAttributes map[string]interface{}) (*Message, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	if content != "" {
		_ = writer.WriteField("content", content)
	}
	_ = writer.WriteField("message_type", messageType)

	// Add content_attributes for reply/quote support
	if contentAttributes != nil {
		attrsJSON, err := json.Marshal(contentAttributes)
		if err == nil {
			_ = writer.WriteField("content_attributes", string(attrsJSON))
		}
	}

	// Create form file with proper Content-Type header
	var part io.Writer
	var err error
	if mimeType != "" {
		// Use CreatePart for custom Content-Type
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

	if _, err := io.Copy(part, attachment); err != nil {
		return nil, fmt.Errorf("failed to copy attachment: %w", err)
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

	var msg Message
	if err := json.Unmarshal(respBody, &msg); err != nil {
		return nil, fmt.Errorf("failed to parse message response: %w", err)
	}

	return &msg, nil
}

// Helper functions

// GetInboxByName finds an inbox by name
func (c *Client) GetInboxByName(ctx context.Context, name string) (*Inbox, error) {
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

// GetOrCreateInbox gets an existing inbox by name or creates a new one
func (c *Client) GetOrCreateInbox(ctx context.Context, name, webhookURL string) (*Inbox, error) {
	return c.GetOrCreateInboxWithOptions(ctx, name, webhookURL, false)
}

// GetOrCreateInboxWithOptions gets an existing inbox or creates one with lock_to_single_conversation option
func (c *Client) GetOrCreateInboxWithOptions(ctx context.Context, name, webhookURL string, lockToSingleConversation bool) (*Inbox, error) {
	inbox, err := c.GetInboxByName(ctx, name)
	if err != nil {
		return nil, err
	}

	if inbox != nil {
		// Update lock setting if needed
		if lockToSingleConversation {
			_, err := c.UpdateInboxLockSetting(ctx, inbox.ID, lockToSingleConversation)
			if err != nil {
				logger.Warn().Err(err).Int("inboxId", inbox.ID).Msg("Chatwoot: failed to update inbox lock_to_single_conversation")
			}
		}
		return inbox, nil
	}

	return c.CreateInboxWithOptions(ctx, name, webhookURL, lockToSingleConversation)
}

// GetOrCreateContact gets or creates a contact
func (c *Client) GetOrCreateContact(ctx context.Context, inboxID int, phoneNumber, identifier, name, avatarURL string, isGroup bool) (*Contact, error) {
	return c.GetOrCreateContactWithMerge(ctx, inboxID, phoneNumber, identifier, name, avatarURL, isGroup, false)
}

// GetOrCreateContactWithMerge gets or creates a contact with optional Brazilian number merge
func (c *Client) GetOrCreateContactWithMerge(ctx context.Context, inboxID int, phoneNumber, identifier, name, avatarURL string, isGroup bool, mergeBrPhones bool) (*Contact, error) {
	var contact *Contact
	var err error

	if isGroup {
		contact, err = c.FindContactByIdentifier(ctx, identifier)
	} else {
		phone := "+" + phoneNumber
		
		// If merge enabled for Brazilian numbers, search both formats and merge if needed
		if mergeBrPhones && strings.HasPrefix(phone, "+55") {
			contacts, err := c.SearchContactsForBrazilianMerge(ctx, phone)
			if err != nil {
				return nil, err
			}
			
			// If found 2 different contacts, merge them
			if len(contacts) == 2 {
				if err := c.MergeContacts(ctx, contacts[0].ID, contacts[1].ID); err != nil {
					logger.Warn().Err(err).Msg("Chatwoot: failed to merge Brazilian contacts")
				} else {
					logger.Info().
						Int("baseContactId", contacts[0].ID).
						Int("mergeContactId", contacts[1].ID).
						Msg("Chatwoot: merged Brazilian contacts")
				}
				contact = contacts[0]
			} else if len(contacts) == 1 {
				contact = contacts[0]
			}
		} else {
			contact, err = c.FindContactByPhone(ctx, phone)
		}
	}

	if err != nil {
		return nil, err
	}

	if contact != nil {
		return contact, nil
	}

	// Create new contact
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

// GetOrCreateConversation gets an open conversation or creates a new one
// If autoReopen is true, it will reopen resolved conversations instead of creating new ones
func (c *Client) GetOrCreateConversation(ctx context.Context, contactID, inboxID int, status string, autoReopen bool) (*Conversation, error) {
	conversations, err := c.ListContactConversations(ctx, contactID)
	if err != nil {
		return nil, err
	}

	// Find conversation in the same inbox
	for _, conv := range conversations {
		if conv.InboxID != inboxID {
			continue
		}

		// If autoReopen is enabled, return any conversation (even resolved)
		if autoReopen {
			// If conversation is resolved and we want to reopen, toggle status
			if conv.Status == "resolved" {
				reopened, err := c.ToggleConversationStatus(ctx, conv.ID, status)
				if err != nil {
					return &conv, nil // Return original if toggle fails
				}
				return reopened, nil
			}
			return &conv, nil
		}

		// If autoReopen is disabled, only return non-resolved conversations
		if conv.Status != "resolved" {
			return &conv, nil
		}
	}

	// Create new conversation
	req := &CreateConversationRequest{
		InboxID:   strconv.Itoa(inboxID),
		ContactID: strconv.Itoa(contactID),
		Status:    status,
	}

	return c.CreateConversation(ctx, req)
}

// GetMediaType returns the media type based on file extension
// Deprecated: Use GetMediaTypeFromFilename instead
func GetMediaType(filename string) string {
	return GetMediaTypeFromFilename(filename)
}

// UpdateLastSeen marks a conversation as read/seen in Chatwoot using the public API
// This updates the read receipts/ticks in the Chatwoot interface
func (c *Client) UpdateLastSeen(ctx context.Context, inboxIdentifier, contactSourceID string, conversationID int) error {
	if inboxIdentifier == "" || contactSourceID == "" {
		return fmt.Errorf("inbox_identifier and contact_source_id are required")
	}

	// Public API endpoint - doesn't use account ID
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

// GetConversationWithContactInbox gets a conversation with contact inbox details
func (c *Client) GetConversationWithContactInbox(ctx context.Context, conversationID int) (*Conversation, string, error) {
	data, err := c.doRequest(ctx, http.MethodGet, fmt.Sprintf("/conversations/%d", conversationID), nil)
	if err != nil {
		return nil, "", err
	}

	// Parse the full response to get contact_inbox.source_id from last_non_activity_message
	var result struct {
		Conversation
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
