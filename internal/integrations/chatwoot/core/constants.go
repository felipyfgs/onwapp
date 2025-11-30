package core

import "time"

// Batch size constants for sync operations
const (
	ContactBatchSize      = 3000
	MessageBatchSize      = 4000
	ConversationBatchSize = 500
	QueryBatchSize        = 10000
	MaxMessagesPerSync    = 50000
)

// Rate limiting constants
const (
	MediaRateLimit  = 300 * time.Millisecond
	AvatarRateLimit = 100 * time.Millisecond
)

// Cache TTL constants
const (
	ConversationCacheTTL = 8 * time.Hour
)

// Sync status constants
const (
	SyncStatusIdle      = "idle"
	SyncStatusRunning   = "running"
	SyncStatusCompleted = "completed"
	SyncStatusFailed    = "failed"
)

// Sync type constants
const (
	SyncTypeAll      = "all"
	SyncTypeContacts = "contacts"
	SyncTypeMessages = "messages"
)

// Message type constants
const (
	MessageTypeIncoming = "incoming"
	MessageTypeOutgoing = "outgoing"
)

// Bot contact phone (Evolution API pattern)
const BotContactPhone = "123456"
