package sync

import (
	"errors"
	"fmt"
)

// Sync-specific errors
var (
	ErrContactsGetterNil = errors.New("contacts getter not available")
	ErrNoValidContacts   = errors.New("no valid contacts to sync")
	ErrNoValidMessages   = errors.New("no valid messages to sync")
	ErrUserNotFound      = errors.New("chatwoot user not found for token")
)

// SyncError wraps an error with operation context
type SyncError struct {
	Op  string
	Err error
}

func (e *SyncError) Error() string {
	return fmt.Sprintf("%s: %v", e.Op, e.Err)
}

func (e *SyncError) Unwrap() error {
	return e.Err
}

// wrapErr wraps an error with operation context
func wrapErr(op string, err error) error {
	if err == nil {
		return nil
	}
	return &SyncError{Op: op, Err: err}
}

// BatchError represents an error during batch processing
type BatchError struct {
	BatchIndex int
	BatchSize  int
	Err        error
}

func (e *BatchError) Error() string {
	return fmt.Sprintf("batch %d (size %d): %v", e.BatchIndex, e.BatchSize, e.Err)
}

func (e *BatchError) Unwrap() error {
	return e.Err
}
