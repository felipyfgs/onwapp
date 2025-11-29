package chatwoot

// SetConfigRequest represents the request to set Chatwoot config
type SetConfigRequest struct {
	Enabled        bool     `json:"enabled"`
	URL            string   `json:"url" binding:"required_if=Enabled true"`
	Token          string   `json:"token" binding:"required_if=Enabled true"`
	Account        int      `json:"account" binding:"required_if=Enabled true"`
	Inbox          string   `json:"inbox,omitempty"`
	SignAgent      bool     `json:"signAgent"`
	SignSeparator  string   `json:"signSeparator,omitempty"`
	AutoReopen     bool     `json:"autoReopen"`
	StartPending   bool     `json:"startPending"`
	MergeBrPhones  bool     `json:"mergeBrPhones"`
	SyncContacts   bool     `json:"syncContacts"`
	SyncMessages   bool     `json:"syncMessages"`
	SyncDays       int      `json:"syncDays,omitempty"`
	IgnoreChats    []string `json:"ignoreChats,omitempty"`
	AutoInbox      bool     `json:"autoInbox"`
	ChatwootDBHost string   `json:"chatwootDbHost,omitempty"`
	ChatwootDBPort int      `json:"chatwootDbPort,omitempty"`
	ChatwootDBUser string   `json:"chatwootDbUser,omitempty"`
	ChatwootDBPass string   `json:"chatwootDbPass,omitempty"`
	ChatwootDBName string   `json:"chatwootDbName,omitempty"`
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

// CreateConversationRequest for Chatwoot API calls
type CreateConversationRequest struct {
	SourceID   string `json:"source_id,omitempty"`
	InboxID    string `json:"inbox_id"`
	ContactID  string `json:"contact_id"`
	Status     string `json:"status,omitempty"`
	AssigneeID int    `json:"assignee_id,omitempty"`
}

// CreateMessageRequest for Chatwoot API calls
type CreateMessageRequest struct {
	Content           string                 `json:"content,omitempty"`
	MessageType       string                 `json:"message_type"`
	Private           bool                   `json:"private,omitempty"`
	ContentAttributes map[string]interface{} `json:"content_attributes,omitempty"`
	SourceID          string                 `json:"source_id,omitempty"`
}
