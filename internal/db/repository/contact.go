package repository

import (
	"context"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/logger"
)

// ContactRepository provides access to whatsmeow_contacts for pushName lookups
type ContactRepository struct {
	pool *pgxpool.Pool

	// In-memory cache for pushNames (JID -> pushName)
	cache     map[string]string
	cacheMu   sync.RWMutex
	cacheTime time.Time
	cacheTTL  time.Duration
}

func NewContactRepository(pool *pgxpool.Pool) *ContactRepository {
	return &ContactRepository{
		pool:     pool,
		cache:    make(map[string]string),
		cacheTTL: 5 * time.Minute,
	}
}

// GetPushName returns the pushName for a JID from whatsmeow_contacts
func (r *ContactRepository) GetPushName(ctx context.Context, deviceJID, theirJID string) string {
	if theirJID == "" {
		return ""
	}

	// Check cache first
	r.cacheMu.RLock()
	if name, ok := r.cache[theirJID]; ok {
		r.cacheMu.RUnlock()
		return name
	}
	r.cacheMu.RUnlock()

	// Query database
	var pushName string
	err := r.pool.QueryRow(ctx, `
		SELECT COALESCE(push_name, '') 
		FROM whatsmeow_contacts 
		WHERE our_jid = $1 AND their_jid = $2`,
		deviceJID, theirJID,
	).Scan(&pushName)

	if err != nil {
		return ""
	}

	// Update cache
	r.cacheMu.Lock()
	r.cache[theirJID] = pushName
	r.cacheMu.Unlock()

	return pushName
}

// GetPushNameBatch returns pushNames for multiple JIDs efficiently
func (r *ContactRepository) GetPushNameBatch(ctx context.Context, deviceJID string, jids []string) map[string]string {
	if len(jids) == 0 {
		return nil
	}

	result := make(map[string]string)

	// Check cache first
	var uncached []string
	r.cacheMu.RLock()
	for _, jid := range jids {
		if name, ok := r.cache[jid]; ok {
			result[jid] = name
		} else {
			uncached = append(uncached, jid)
		}
	}
	r.cacheMu.RUnlock()

	if len(uncached) == 0 {
		return result
	}

	// Query uncached JIDs
	rows, err := r.pool.Query(ctx, `
		SELECT their_jid, COALESCE(push_name, '')
		FROM whatsmeow_contacts
		WHERE our_jid = $1 AND their_jid = ANY($2)`,
		deviceJID, uncached,
	)
	if err != nil {
		return result
	}
	defer rows.Close()

	// Update results and cache
	r.cacheMu.Lock()
	for rows.Next() {
		var jid, pushName string
		if err := rows.Scan(&jid, &pushName); err == nil {
			result[jid] = pushName
			r.cache[jid] = pushName
		}
	}
	r.cacheMu.Unlock()

	return result
}

// LoadAllPushNames loads all pushNames for a device into cache
func (r *ContactRepository) LoadAllPushNames(ctx context.Context, deviceJID string) error {
	rows, err := r.pool.Query(ctx, `
		SELECT their_jid, COALESCE(push_name, '')
		FROM whatsmeow_contacts
		WHERE our_jid = $1 AND push_name IS NOT NULL AND push_name != ''`,
		deviceJID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	r.cacheMu.Lock()
	defer r.cacheMu.Unlock()

	count := 0
	for rows.Next() {
		var jid, pushName string
		if err := rows.Scan(&jid, &pushName); err == nil && pushName != "" {
			r.cache[jid] = pushName
			count++
		}
	}

	r.cacheTime = time.Now()
	logger.Info().Int("contacts", count).Msg("Loaded pushNames into cache")

	return rows.Err()
}

// RefreshCacheIfNeeded refreshes the cache if TTL has expired
func (r *ContactRepository) RefreshCacheIfNeeded(ctx context.Context, deviceJID string) {
	r.cacheMu.RLock()
	needsRefresh := time.Since(r.cacheTime) > r.cacheTTL
	r.cacheMu.RUnlock()

	if needsRefresh {
		if err := r.LoadAllPushNames(ctx, deviceJID); err != nil {
			logger.Warn().Err(err).Msg("Failed to refresh pushName cache")
		}
	}
}

// ClearCache clears the pushName cache
func (r *ContactRepository) ClearCache() {
	r.cacheMu.Lock()
	r.cache = make(map[string]string)
	r.cacheTime = time.Time{}
	r.cacheMu.Unlock()
}

// UpdateMessagesPushNames updates pushName for messages that have empty pushName
func (r *ContactRepository) UpdateMessagesPushNames(ctx context.Context, sessionID, deviceJID string, limit int) (int, error) {
	// First, ensure cache is loaded
	if err := r.LoadAllPushNames(ctx, deviceJID); err != nil {
		return 0, err
	}

	result, err := r.pool.Exec(ctx, `
		UPDATE "zpMessages" m
		SET "pushName" = c.push_name
		FROM whatsmeow_contacts c
		WHERE m."sessionId" = $1
			AND (m."pushName" IS NULL OR m."pushName" = '')
			AND c.our_jid = $2
			AND c.their_jid = m."senderJid"
			AND c.push_name IS NOT NULL
			AND c.push_name != ''`,
		sessionID, deviceJID,
	)
	if err != nil {
		return 0, err
	}

	return int(result.RowsAffected()), nil
}

// UpdatePastParticipantsPushNames updates pushName for past participants
func (r *ContactRepository) UpdatePastParticipantsPushNames(ctx context.Context, sessionID, deviceJID string) (int, error) {
	result, err := r.pool.Exec(ctx, `
		UPDATE "zpGroupPastParticipants" pp
		SET "pushName" = c.push_name
		FROM whatsmeow_contacts c
		WHERE pp."sessionId" = $1
			AND (pp."pushName" IS NULL OR pp."pushName" = '')
			AND c.our_jid = $2
			AND c.their_jid = pp."userJid"
			AND c.push_name IS NOT NULL
			AND c.push_name != ''`,
		sessionID, deviceJID,
	)
	if err != nil {
		return 0, err
	}

	return int(result.RowsAffected()), nil
}
