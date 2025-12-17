package service

import (
	"context"

	"onwapp/internal/db/repository"
)

type SettingsAdapter struct {
	repo *repository.SettingsRepository
}

func NewSettingsAdapter(repo *repository.SettingsRepository) *SettingsAdapter {
	return &SettingsAdapter{repo: repo}
}

func (a *SettingsAdapter) GetBySessionID(ctx context.Context, sessionID string) (alwaysOnline, autoRejectCalls bool, err error) {
	return a.repo.GetLocalSettingsBySessionID(ctx, sessionID)
}

func (a *SettingsAdapter) EnsureExists(ctx context.Context, sessionID string) error {
	_, err := a.repo.EnsureExists(ctx, sessionID)
	return err
}

func (a *SettingsAdapter) SyncPrivacyFromWhatsApp(ctx context.Context, sessionID string, privacy map[string]string) error {
	_, err := a.repo.SyncPrivacyFromWhatsApp(ctx, sessionID, privacy)
	return err
}
