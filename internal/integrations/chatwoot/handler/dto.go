package handler

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
