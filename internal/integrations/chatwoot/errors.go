package chatwoot

import "errors"

// Sentinel errors for Chatwoot integration
var (
	ErrSyncInProgress = errors.New("sync already in progress")
)
