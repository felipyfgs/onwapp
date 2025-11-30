package model

import "time"

// LeaveReason represents why a participant left a group
type LeaveReason int

const (
	LeaveReasonLeft    LeaveReason = 0 // User left voluntarily
	LeaveReasonRemoved LeaveReason = 1 // User was removed by admin
)

// GroupPastParticipant represents a user who left or was removed from a group
type GroupPastParticipant struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`
	GroupJID  string `json:"groupJid"`
	UserJID   string `json:"userJid"`

	// Leave details
	LeaveReason    LeaveReason `json:"leaveReason"`
	LeaveTimestamp time.Time   `json:"leaveTimestamp"`

	// Resolved info
	Phone    string `json:"phone,omitempty"`
	PushName string `json:"pushName,omitempty"`

	// Timestamps
	SyncedAt time.Time `json:"syncedAt"`
}

// WasRemoved returns true if the participant was removed by admin
func (p *GroupPastParticipant) WasRemoved() bool {
	return p.LeaveReason == LeaveReasonRemoved
}

// LeftVoluntarily returns true if the participant left on their own
func (p *GroupPastParticipant) LeftVoluntarily() bool {
	return p.LeaveReason == LeaveReasonLeft
}

// SyncType represents the type of history sync
type SyncType string

const (
	SyncTypeInitialBootstrap SyncType = "INITIAL_BOOTSTRAP"
	SyncTypeInitialStatus    SyncType = "INITIAL_STATUS_V3"
	SyncTypePushName         SyncType = "PUSH_NAME"
	SyncTypeRecent           SyncType = "RECENT"
	SyncTypeFull             SyncType = "FULL"
	SyncTypeNonBlockingData  SyncType = "NON_BLOCKING_DATA"
	SyncTypeOnDemand         SyncType = "ON_DEMAND"
)

// SyncStatus represents the status of a sync operation
type SyncStatus string

const (
	SyncStatusPending    SyncStatus = "pending"
	SyncStatusInProgress SyncStatus = "in_progress"
	SyncStatusCompleted  SyncStatus = "completed"
	SyncStatusFailed     SyncStatus = "failed"
)

// HistorySyncProgress tracks the progress of history sync operations
// Aligned with migration 011_history_sync_progress.sql
type HistorySyncProgress struct {
	ID        string `json:"id"`
	SessionID string `json:"sessionId"`

	// Sync identification
	SyncType SyncType `json:"syncType"`

	// Progress markers
	LastChunkIndex int        `json:"lastChunkIndex"`
	LastMsgOrderID *int64     `json:"lastMsgOrderId,omitempty"`
	LastTimestamp  *time.Time `json:"lastTimestamp,omitempty"`

	// Status
	Status   SyncStatus `json:"status"`
	Progress int        `json:"progress"` // 0-100 percentage

	// Statistics
	TotalChunks       *int `json:"totalChunks,omitempty"`
	ProcessedChunks   int  `json:"processedChunks"`
	TotalMessages     int  `json:"totalMessages"`
	ProcessedMessages int  `json:"processedMessages"`
	TotalChats        int  `json:"totalChats"`
	ProcessedChats    int  `json:"processedChats"`
	Errors            int  `json:"errors"`

	// Timestamps
	StartedAt   *time.Time `json:"startedAt,omitempty"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// IsComplete returns true if sync is finished
func (p *HistorySyncProgress) IsComplete() bool {
	return p.Status == SyncStatusCompleted
}

// ProgressPercent returns completion percentage (0-100)
func (p *HistorySyncProgress) ProgressPercent() int {
	return p.Progress
}
