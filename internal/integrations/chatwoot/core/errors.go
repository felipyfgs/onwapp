package core

import "errors"

// Sentinel errors for Chatwoot integration
var (
	// Sync errors
	ErrSyncInProgress = errors.New("sync already in progress")

	// Configuration errors
	ErrNotConfigured      = errors.New("chatwoot not configured")
	ErrNotEnabled         = errors.New("chatwoot not enabled")
	ErrInboxNotConfigured = errors.New("chatwoot inbox not configured")
	ErrDBNotConfigured    = errors.New("chatwoot database not configured")

	// Contact errors
	ErrContactNotFound = errors.New("contact not found")
	ErrBotNotFound     = errors.New("bot contact not found")

	// Conversation errors
	ErrConversationNotFound = errors.New("conversation not found")
	ErrConversationTimeout  = errors.New("timeout waiting for conversation creation")

	// Message errors
	ErrMessageNotFound = errors.New("message not found")
	ErrEmptyContent    = errors.New("message content is empty")

	// Media errors
	ErrMediaDownloadFailed = errors.New("failed to download media")
	ErrMediaUploadFailed   = errors.New("failed to upload media")
)
