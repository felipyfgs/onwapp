package chatwoot

import (
	"sync"
)

// Global sync status management
var (
	syncStatusMap   = make(map[string]*SyncStatus)
	syncStatusMutex sync.RWMutex
)

// GetSyncStatus returns the current sync status for a session
func GetSyncStatus(sessionID string) *SyncStatus {
	syncStatusMutex.RLock()
	defer syncStatusMutex.RUnlock()
	if status, ok := syncStatusMap[sessionID]; ok {
		return status
	}
	return &SyncStatus{SessionID: sessionID, Status: SyncStatusIdle}
}

// SetSyncStatus sets the sync status for a session
func SetSyncStatus(sessionID string, status *SyncStatus) {
	syncStatusMutex.Lock()
	defer syncStatusMutex.Unlock()
	syncStatusMap[sessionID] = status
}

// UpdateSyncStats updates the stats for a running sync
func UpdateSyncStats(sessionID string, stats *SyncStats) {
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
