package core

import (
	"errors"
	"strings"
)

var (
	ErrSyncInProgress = errors.New("sync already in progress")

	ErrNotConfigured      = errors.New("chatwoot not configured")
	ErrNotEnabled         = errors.New("chatwoot not enabled")
	ErrInboxNotConfigured = errors.New("chatwoot inbox not configured")
	ErrDBNotConfigured    = errors.New("chatwoot database not configured")

	ErrContactNotFound = errors.New("contact not found")
	ErrBotNotFound     = errors.New("bot contact not found")

	ErrConversationNotFound = errors.New("conversation not found")
	ErrConversationTimeout  = errors.New("timeout waiting for conversation creation")
	ErrConversationDeleted  = errors.New("conversation was deleted in chatwoot")

	ErrMessageNotFound = errors.New("message not found")
	ErrEmptyContent    = errors.New("message content is empty")

	ErrMediaDownloadFailed = errors.New("failed to download media")
	ErrMediaUploadFailed   = errors.New("failed to upload media")
)

func IsNotFoundError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return strings.Contains(errStr, "status 404") ||
		strings.Contains(errStr, "Resource could not be found")
}
