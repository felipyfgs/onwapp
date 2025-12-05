package sync

import (
	gosync "sync"

	"onwapp/internal/integrations/chatwoot/core"
)

var (
	syncStatusMap   = make(map[string]*core.SyncStatus)
	syncStatusMutex gosync.RWMutex
)

// GetSyncStatus returns the current sync status for a session
func GetSyncStatus(sessionID string) *core.SyncStatus {
	syncStatusMutex.RLock()
	defer syncStatusMutex.RUnlock()

	if status, ok := syncStatusMap[sessionID]; ok {
		return status
	}
	return &core.SyncStatus{
		SessionID: sessionID,
		Status:    core.SyncStatusIdle,
	}
}

// SetSyncStatus sets the sync status for a session
func SetSyncStatus(sessionID string, status *core.SyncStatus) {
	syncStatusMutex.Lock()
	defer syncStatusMutex.Unlock()
	syncStatusMap[sessionID] = status
}

// UpdateSyncStats updates the stats for a running sync
func UpdateSyncStats(sessionID string, stats *core.SyncStats) {
	syncStatusMutex.Lock()
	defer syncStatusMutex.Unlock()

	if status, ok := syncStatusMap[sessionID]; ok {
		status.Stats = *stats
	}
}

// ClearSyncStatus removes the sync status for a session
func ClearSyncStatus(sessionID string) {
	syncStatusMutex.Lock()
	defer syncStatusMutex.Unlock()
	delete(syncStatusMap, sessionID)
}

// IsSyncRunning checks if a sync is currently running for a session
func IsSyncRunning(sessionID string) bool {
	syncStatusMutex.RLock()
	defer syncStatusMutex.RUnlock()

	if status, ok := syncStatusMap[sessionID]; ok {
		return status.Status == core.SyncStatusRunning
	}
	return false
}
