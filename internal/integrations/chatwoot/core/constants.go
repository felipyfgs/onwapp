package core

import "time"

const (
	ContactBatchSize      = 3000
	MessageBatchSize      = 4000
	ConversationBatchSize = 500
	QueryBatchSize        = 10000
	MaxMessagesPerSync    = 50000
)

const (
	MediaRateLimit  = 300 * time.Millisecond
	AvatarRateLimit = 100 * time.Millisecond
)

const (
	MediaWorkers       = 3
	MediaRatePerSecond = 3.0
	MediaBatchSize     = 50
	CwFieldsBatchSize  = 500
)

const (
	PipelineBufferSize = 100
)

const (
	ConversationCacheTTL = 8 * time.Hour
)

const (
	SyncStatusIdle      = "idle"
	SyncStatusRunning   = "running"
	SyncStatusCompleted = "completed"
	SyncStatusFailed    = "failed"
)

const (
	SyncTypeAll      = "all"
	SyncTypeContacts = "contacts"
	SyncTypeMessages = "messages"
)

const (
	MessageTypeIncoming = "incoming"
	MessageTypeOutgoing = "outgoing"
)

const BotContactPhone = "123456"
