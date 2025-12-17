package handler

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

// AccountInfo represents a Chatwoot account
type AccountInfo struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

type ValidateCredentialsRequest struct {
	URL     string `json:"url" binding:"required"`
	Token   string `json:"token" binding:"required"`
	Account int    `json:"account" binding:"required"`
}

type SetConfigRequest struct {
	Enabled        bool     `json:"enabled"`
	URL            string   `json:"url" binding:"required_if=Enabled true"`
	Token          string   `json:"token" binding:"required_if=Enabled true"`
	Account        int      `json:"account" binding:"required_if=Enabled true"`
	InboxID        int      `json:"inboxId,omitempty"`
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
	AutoCreate     bool     `json:"autoCreate"`
	Number         string   `json:"number,omitempty"`
	Organization   string   `json:"organization,omitempty"`
	Logo           string   `json:"logo,omitempty"`
	ChatwootDBHost string   `json:"chatwootDbHost,omitempty"`
	ChatwootDBPort int      `json:"chatwootDbPort,omitempty"`
	ChatwootDBUser string   `json:"chatwootDbUser,omitempty"`
	ChatwootDBPass string   `json:"chatwootDbPass,omitempty"`
	ChatwootDBName string   `json:"chatwootDbName,omitempty"`
}
