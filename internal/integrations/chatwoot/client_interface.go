package chatwoot

import (
	"context"
	"io"
)

// ChatwootClientInterface defines the interface for Chatwoot API operations
// This allows for easier testing with mocks
type ChatwootClientInterface interface {
	// Inbox operations
	ListInboxes(ctx context.Context) ([]Inbox, error)
	GetInbox(ctx context.Context, inboxID int) (*Inbox, error)
	CreateInbox(ctx context.Context, name, webhookURL string) (*Inbox, error)
	GetInboxByName(ctx context.Context, name string) (*Inbox, error)
	GetOrCreateInbox(ctx context.Context, name, webhookURL string) (*Inbox, error)

	// Contact operations
	FindContactByPhone(ctx context.Context, phone string) (*Contact, error)
	FindContactByIdentifier(ctx context.Context, identifier string) (*Contact, error)
	GetContact(ctx context.Context, contactID int) (*Contact, error)
	CreateContact(ctx context.Context, req *CreateContactRequest) (*Contact, error)
	UpdateContact(ctx context.Context, contactID int, updates map[string]interface{}) (*Contact, error)
	ListContactConversations(ctx context.Context, contactID int) ([]Conversation, error)
	MergeContacts(ctx context.Context, baseContactID, mergeContactID int) error
	GetOrCreateContact(ctx context.Context, inboxID int, phoneNumber, identifier, name, avatarURL string, isGroup bool) (*Contact, error)

	// Conversation operations
	GetConversation(ctx context.Context, conversationID int) (*Conversation, error)
	CreateConversation(ctx context.Context, req *CreateConversationRequest) (*Conversation, error)
	ToggleConversationStatus(ctx context.Context, conversationID int, status string) (*Conversation, error)
	GetOrCreateConversation(ctx context.Context, contactID, inboxID int, status string, autoReopen bool) (*Conversation, error)

	// Message operations
	CreateMessage(ctx context.Context, conversationID int, req *CreateMessageRequest) (*Message, error)
	DeleteMessage(ctx context.Context, conversationID, messageID int) error
	CreateMessageWithAttachment(ctx context.Context, conversationID int, content, messageType string, attachment io.Reader, filename string, contentAttributes map[string]interface{}) (*Message, error)
}

// Ensure Client implements ChatwootClientInterface
var _ ChatwootClientInterface = (*Client)(nil)
