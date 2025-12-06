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

// Worker pool constants for parallel processing
const (
	MediaWorkers       = 3   // Number of concurrent media upload workers
	MediaRatePerSecond = 3.0 // Max media uploads per second (across all workers)
	MediaBatchSize     = 50  // Process media in batches of this size
	CwFieldsBatchSize  = 500 // Batch size for CwFields updates
)

// Pipeline constants
const (
	PipelineBufferSize = 100 // Channel buffer size for pipeline stages
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
