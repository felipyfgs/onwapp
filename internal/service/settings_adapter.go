package service

import (
	"context"

	"onwapp/internal/db/repository"
)

// SettingsAdapter adapts SettingsRepository to the event.SettingsProvider interface
type SettingsAdapter struct {
	repo *repository.SettingsRepository
}

// NewSettingsAdapter creates a new settings adapter
func NewSettingsAdapter(repo *repository.SettingsRepository) *SettingsAdapter {
	return &SettingsAdapter{repo: repo}
}

// GetBySessionID returns local settings (alwaysOnline, autoRejectCalls) for a session
func (a *SettingsAdapter) GetBySessionID(ctx context.Context, sessionID string) (alwaysOnline, autoRejectCalls bool, err error) {
	return a.repo.GetLocalSettingsBySessionID(ctx, sessionID)
}

// EnsureExists ensures settings exist for a session, creating defaults if needed
func (a *SettingsAdapter) EnsureExists(ctx context.Context, sessionID string) error {
	_, err := a.repo.EnsureExists(ctx, sessionID)
	return err
}

// SyncPrivacyFromWhatsApp syncs privacy settings from WhatsApp to database
func (a *SettingsAdapter) SyncPrivacyFromWhatsApp(ctx context.Context, sessionID string, privacy map[string]string) error {
	_, err := a.repo.SyncPrivacyFromWhatsApp(ctx, sessionID, privacy)
	return err
}
