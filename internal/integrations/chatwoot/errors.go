package chatwoot

import (
	"errors"
	"fmt"
)

// Sentinel errors for Chatwoot integration
var (
	ErrContactNotFound      = errors.New("contact not found")
	ErrConversationNotFound = errors.New("conversation not found")
	ErrMessageNotFound      = errors.New("message not found")
	ErrInboxNotConfigured   = errors.New("inbox not configured")
	ErrSyncInProgress       = errors.New("sync already in progress")
	ErrSyncTimeout          = errors.New("sync timeout")
	ErrDatabaseNotConnected = errors.New("database not connected")
	ErrConfigNotFound       = errors.New("chatwoot config not found")
	ErrConfigDisabled       = errors.New("chatwoot integration disabled")
	ErrInvalidJID           = errors.New("invalid JID format")
	ErrMediaDownloadFailed  = errors.New("media download failed")
	ErrAPIRequestFailed     = errors.New("chatwoot API request failed")
)

// ChatwootError represents a structured error for Chatwoot operations
type ChatwootError struct {
	Op      string // Operation name
	Err     error  // Underlying error
	Details string // Additional context
}

func (e *ChatwootError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("%s: %v (%s)", e.Op, e.Err, e.Details)
	}
	return fmt.Sprintf("%s: %v", e.Op, e.Err)
}

func (e *ChatwootError) Unwrap() error {
	return e.Err
}

// WrapError creates a new ChatwootError
func WrapError(op string, err error) *ChatwootError {
	return &ChatwootError{Op: op, Err: err}
}

// WrapErrorWithDetails creates a new ChatwootError with additional details
func WrapErrorWithDetails(op string, err error, details string) *ChatwootError {
	return &ChatwootError{Op: op, Err: err, Details: details}
}

// IsNotFound checks if error is a not found error
func IsNotFound(err error) bool {
	return errors.Is(err, ErrContactNotFound) ||
		errors.Is(err, ErrConversationNotFound) ||
		errors.Is(err, ErrMessageNotFound) ||
		errors.Is(err, ErrConfigNotFound)
}

// IsSyncError checks if error is sync-related
func IsSyncError(err error) bool {
	return errors.Is(err, ErrSyncInProgress) || errors.Is(err, ErrSyncTimeout)
}
