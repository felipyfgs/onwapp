package model

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

type HistorySyncStatus string

const (
	HistorySyncStatusPending   HistorySyncStatus = "pending"
	HistorySyncStatusSyncing   HistorySyncStatus = "syncing"
	HistorySyncStatusCompleted HistorySyncStatus = "completed"
)
