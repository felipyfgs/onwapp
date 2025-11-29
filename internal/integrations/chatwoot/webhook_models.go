package chatwoot

// WebhookPayload represents incoming webhook from Chatwoot
type WebhookPayload struct {
	Event        string                 `json:"event"`
	ID           int                    `json:"id,omitempty"`
	Content      string                 `json:"content,omitempty"`
	MessageType  string                 `json:"message_type,omitempty"`
	ContentType  string                 `json:"content_type,omitempty"`
	ContentAttrs map[string]interface{} `json:"content_attributes,omitempty"`
	Private      bool                   `json:"private,omitempty"`
	SourceID     string                 `json:"source_id,omitempty"`
	Conversation *WebhookConversation   `json:"conversation,omitempty"`
	Sender       *Sender                `json:"sender,omitempty"`
	Inbox        *Inbox                 `json:"inbox,omitempty"`
	Account      *Account               `json:"account,omitempty"`
	Attachments  []Attachment           `json:"attachments,omitempty"`
}

// WebhookConversation represents conversation data in webhook payload
type WebhookConversation struct {
	ID           int               `json:"id"`
	InboxID      int               `json:"inbox_id,omitempty"`
	Status       string            `json:"status,omitempty"`
	Messages     []Message         `json:"messages,omitempty"`
	Meta         *ConversationMeta `json:"meta,omitempty"`
	ContactInbox *ContactInbox     `json:"contact_inbox,omitempty"`
}

// ConversationMeta represents metadata in conversation
type ConversationMeta struct {
	Sender *Contact `json:"sender,omitempty"`
}

// Account represents a Chatwoot account
type Account struct {
	ID   int    `json:"id"`
	Name string `json:"name,omitempty"`
}
