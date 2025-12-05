package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"onwapp/internal/model"
)

type SettingsRepository struct {
	pool *pgxpool.Pool
}

func NewSettingsRepository(pool *pgxpool.Pool) *SettingsRepository {
	return &SettingsRepository{pool: pool}
}

func (r *SettingsRepository) Create(ctx context.Context, settings *model.Settings) (*model.Settings, error) {
	query := `
		INSERT INTO "onWappSettings" (
			"sessionId", "alwaysOnline", "autoRejectCalls", "syncHistory",
			"lastSeen", "online", "profilePhoto", "status", "readReceipts", "groupAdd", "callAdd",
			"defaultDisappearingTimer", "privacySyncedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING "id", "createdAt", "updatedAt"`

	err := r.pool.QueryRow(ctx, query,
		settings.SessionID,
		settings.AlwaysOnline,
		settings.AutoRejectCalls,
		settings.SyncHistory,
		settings.LastSeen,
		settings.Online,
		settings.ProfilePhoto,
		settings.Status,
		settings.ReadReceipts,
		settings.GroupAdd,
		settings.CallAdd,
		settings.DefaultDisappearingTimer,
		settings.PrivacySyncedAt,
	).Scan(&settings.ID, &settings.CreatedAt, &settings.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create settings: %w", err)
	}

	return settings, nil
}

func (r *SettingsRepository) GetBySessionID(ctx context.Context, sessionID string) (*model.Settings, error) {
	query := `
		SELECT "id", "sessionId", "alwaysOnline", "autoRejectCalls", "syncHistory",
			"lastSeen", "online", "profilePhoto", "status", "readReceipts", "groupAdd", "callAdd",
			"defaultDisappearingTimer", "privacySyncedAt", "createdAt", "updatedAt"
		FROM "onWappSettings"
		WHERE "sessionId" = $1`

	var s model.Settings
	err := r.pool.QueryRow(ctx, query, sessionID).Scan(
		&s.ID, &s.SessionID, &s.AlwaysOnline, &s.AutoRejectCalls, &s.SyncHistory,
		&s.LastSeen, &s.Online, &s.ProfilePhoto, &s.Status, &s.ReadReceipts, &s.GroupAdd, &s.CallAdd,
		&s.DefaultDisappearingTimer, &s.PrivacySyncedAt, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get settings: %w", err)
	}

	return &s, nil
}

func (r *SettingsRepository) GetBySessionName(ctx context.Context, sessionName string) (*model.Settings, error) {
	query := `
		SELECT s."id", s."sessionId", s."alwaysOnline", s."autoRejectCalls", s."syncHistory",
			s."lastSeen", s."online", s."profilePhoto", s."status", s."readReceipts", s."groupAdd", s."callAdd",
			s."defaultDisappearingTimer", s."privacySyncedAt", s."createdAt", s."updatedAt"
		FROM "onWappSettings" s
		JOIN "onWappSession" ss ON s."sessionId" = ss."id"
		WHERE ss."session" = $1`

	var settings model.Settings
	err := r.pool.QueryRow(ctx, query, sessionName).Scan(
		&settings.ID, &settings.SessionID, &settings.AlwaysOnline, &settings.AutoRejectCalls, &settings.SyncHistory,
		&settings.LastSeen, &settings.Online, &settings.ProfilePhoto, &settings.Status, &settings.ReadReceipts, &settings.GroupAdd, &settings.CallAdd,
		&settings.DefaultDisappearingTimer, &settings.PrivacySyncedAt, &settings.CreatedAt, &settings.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get settings by session name: %w", err)
	}

	return &settings, nil
}

func (r *SettingsRepository) Update(ctx context.Context, sessionID string, updates map[string]interface{}) (*model.Settings, error) {
	if len(updates) == 0 {
		return r.GetBySessionID(ctx, sessionID)
	}

	setClauses := ""
	args := []interface{}{sessionID}
	argNum := 2

	for key, value := range updates {
		if setClauses != "" {
			setClauses += ", "
		}
		setClauses += fmt.Sprintf(`"%s" = $%d`, key, argNum)
		args = append(args, value)
		argNum++
	}

	setClauses += fmt.Sprintf(`, "updatedAt" = $%d`, argNum)
	args = append(args, time.Now())

	query := fmt.Sprintf(`
		UPDATE "onWappSettings"
		SET %s
		WHERE "sessionId" = $1
		RETURNING "id", "sessionId", "alwaysOnline", "autoRejectCalls", "syncHistory",
			"lastSeen", "online", "profilePhoto", "status", "readReceipts", "groupAdd", "callAdd",
			"defaultDisappearingTimer", "createdAt", "updatedAt"`,
		setClauses)

	var s model.Settings
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&s.ID, &s.SessionID, &s.AlwaysOnline, &s.AutoRejectCalls, &s.SyncHistory,
		&s.LastSeen, &s.Online, &s.ProfilePhoto, &s.Status, &s.ReadReceipts, &s.GroupAdd, &s.CallAdd,
		&s.DefaultDisappearingTimer, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update settings: %w", err)
	}

	return &s, nil
}

func (r *SettingsRepository) UpdateBySessionName(ctx context.Context, sessionName string, updates map[string]interface{}) (*model.Settings, error) {
	query := `SELECT "id" FROM "onWappSession" WHERE "session" = $1`
	var sessionID string
	err := r.pool.QueryRow(ctx, query, sessionName).Scan(&sessionID)
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}

	return r.Update(ctx, sessionID, updates)
}

func (r *SettingsRepository) Delete(ctx context.Context, sessionID string) error {
	query := `DELETE FROM "onWappSettings" WHERE "sessionId" = $1`
	_, err := r.pool.Exec(ctx, query, sessionID)
	if err != nil {
		return fmt.Errorf("failed to delete settings: %w", err)
	}
	return nil
}

func (r *SettingsRepository) EnsureExists(ctx context.Context, sessionID string) (*model.Settings, error) {
	settings, err := r.GetBySessionID(ctx, sessionID)
	if err == nil {
		return settings, nil
	}

	defaults := model.DefaultLocalSettings(sessionID)
	return r.Create(ctx, defaults)
}

// GetLocalSettingsBySessionID gets only the local settings (alwaysOnline, autoRejectCalls) by session ID
func (r *SettingsRepository) GetLocalSettingsBySessionID(ctx context.Context, sessionID string) (alwaysOnline, autoRejectCalls bool, err error) {
	query := `SELECT "alwaysOnline", "autoRejectCalls" FROM "onWappSettings" WHERE "sessionId" = $1`
	err = r.pool.QueryRow(ctx, query, sessionID).Scan(&alwaysOnline, &autoRejectCalls)
	if err != nil {
		return false, false, fmt.Errorf("failed to get local settings: %w", err)
	}
	return alwaysOnline, autoRejectCalls, nil
}

// SyncPrivacyFromWhatsApp updates privacy settings synced from WhatsApp
// This should be called when session connects to sync current WhatsApp settings
func (r *SettingsRepository) SyncPrivacyFromWhatsApp(ctx context.Context, sessionID string, privacy map[string]string) (*model.Settings, error) {
	now := time.Now()
	query := `
		UPDATE "onWappSettings"
		SET "lastSeen" = $2, "online" = $3, "profilePhoto" = $4, "status" = $5,
			"readReceipts" = $6, "groupAdd" = $7, "callAdd" = $8,
			"privacySyncedAt" = $9, "updatedAt" = $10
		WHERE "sessionId" = $1
		RETURNING "id", "sessionId", "alwaysOnline", "autoRejectCalls", "syncHistory",
			"lastSeen", "online", "profilePhoto", "status", "readReceipts", "groupAdd", "callAdd",
			"defaultDisappearingTimer", "privacySyncedAt", "createdAt", "updatedAt"`

	var s model.Settings
	err := r.pool.QueryRow(ctx, query,
		sessionID,
		privacy["lastSeen"],
		privacy["online"],
		privacy["profilePhoto"],
		privacy["status"],
		privacy["readReceipts"],
		privacy["groupAdd"],
		privacy["callAdd"],
		now,
		now,
	).Scan(
		&s.ID, &s.SessionID, &s.AlwaysOnline, &s.AutoRejectCalls, &s.SyncHistory,
		&s.LastSeen, &s.Online, &s.ProfilePhoto, &s.Status, &s.ReadReceipts, &s.GroupAdd, &s.CallAdd,
		&s.DefaultDisappearingTimer, &s.PrivacySyncedAt, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to sync privacy settings: %w", err)
	}

	return &s, nil
}
