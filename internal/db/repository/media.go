package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type MediaRepository struct {
	pool *pgxpool.Pool
}

func NewMediaRepository(pool *pgxpool.Pool) *MediaRepository {
	return &MediaRepository{pool: pool}
}

func (r *MediaRepository) Save(ctx context.Context, m *model.Media) (string, error) {
	var id string
	now := time.Now()

	err := r.pool.QueryRow(ctx, `
		INSERT INTO "onZapMedia" (
			"sessionId", "msgId",
			"mediaType", "mimeType", "fileSize", "fileName",
			"waDirectPath", "waMediaKey", "waFileSHA256", "waFileEncSHA256", "waMediaKeyTimestamp",
			"width", "height", "duration",
			"storageKey", "storageUrl", "storedAt",
			"thumbnailKey", "thumbnailUrl",
			"downloaded", "downloadError", "downloadAttempts",
			"createdAt", "updatedAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
		ON CONFLICT ("sessionId", "msgId") DO UPDATE SET
			"storageKey" = COALESCE(EXCLUDED."storageKey", "onZapMedia"."storageKey"),
			"storageUrl" = COALESCE(EXCLUDED."storageUrl", "onZapMedia"."storageUrl"),
			"storedAt" = COALESCE(EXCLUDED."storedAt", "onZapMedia"."storedAt"),
			"downloaded" = COALESCE(EXCLUDED."downloaded", "onZapMedia"."downloaded"),
			"downloadError" = EXCLUDED."downloadError",
			"downloadAttempts" = EXCLUDED."downloadAttempts",
			"updatedAt" = $24
		RETURNING "id"`,
		m.SessionID, m.MsgID,
		m.MediaType, m.MimeType, m.FileSize, m.FileName,
		m.WADirectPath, m.WAMediaKey, m.WAFileSHA256, m.WAFileEncSHA256, m.WAMediaKeyTimestamp,
		m.Width, m.Height, m.Duration,
		m.StorageKey, m.StorageURL, m.StoredAt,
		m.ThumbnailKey, m.ThumbnailURL,
		m.Downloaded, m.DownloadError, m.DownloadAttempts,
		now, now,
	).Scan(&id)

	if err == pgx.ErrNoRows {
		return "", nil
	}
	return id, err
}

func (r *MediaRepository) SaveBatch(ctx context.Context, medias []*model.Media) (int, error) {
	if len(medias) == 0 {
		return 0, nil
	}

	now := time.Now()
	saved := 0

	batch := &pgx.Batch{}
	for _, m := range medias {
		batch.Queue(`
			INSERT INTO "onZapMedia" (
				"sessionId", "msgId", "mediaType", "mimeType", "fileSize", "fileName",
				"waDirectPath", "waMediaKey", "waFileSHA256", "waFileEncSHA256", "waMediaKeyTimestamp",
				"width", "height", "duration",
				"downloaded", "createdAt", "updatedAt"
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
			ON CONFLICT ("sessionId", "msgId") DO NOTHING`,
			m.SessionID, m.MsgID, m.MediaType, m.MimeType, m.FileSize, m.FileName,
			m.WADirectPath, m.WAMediaKey, m.WAFileSHA256, m.WAFileEncSHA256, m.WAMediaKeyTimestamp,
			m.Width, m.Height, m.Duration,
			false, now, now,
		)
	}

	results := r.pool.SendBatch(ctx, batch)
	defer func() { _ = results.Close() }()

	for range medias {
		tag, err := results.Exec()
		if err != nil {
			continue
		}
		if tag.RowsAffected() > 0 {
			saved++
		}
	}

	return saved, nil
}

func (r *MediaRepository) GetByMsgID(ctx context.Context, sessionID, msgID string) (*model.Media, error) {
	m := &model.Media{}
	err := r.pool.QueryRow(ctx, `
		SELECT 
			"id", "sessionId", "msgId", "mediaType", COALESCE("mimeType", ''), "fileSize", COALESCE("fileName", ''),
			COALESCE("waDirectPath", ''), "waMediaKey", "waFileSHA256", "waFileEncSHA256", "waMediaKeyTimestamp",
			COALESCE("width", 0), COALESCE("height", 0), COALESCE("duration", 0),
			COALESCE("storageKey", ''), COALESCE("storageUrl", ''), "storedAt",
			COALESCE("thumbnailKey", ''), COALESCE("thumbnailUrl", ''),
			COALESCE("downloaded", false), COALESCE("downloadError", ''), COALESCE("downloadAttempts", 0),
			"createdAt", "updatedAt"
		FROM "onZapMedia"
		WHERE "sessionId" = $1 AND "msgId" = $2`,
		sessionID, msgID,
	).Scan(
		&m.ID, &m.SessionID, &m.MsgID, &m.MediaType, &m.MimeType, &m.FileSize, &m.FileName,
		&m.WADirectPath, &m.WAMediaKey, &m.WAFileSHA256, &m.WAFileEncSHA256, &m.WAMediaKeyTimestamp,
		&m.Width, &m.Height, &m.Duration,
		&m.StorageKey, &m.StorageURL, &m.StoredAt,
		&m.ThumbnailKey, &m.ThumbnailURL,
		&m.Downloaded, &m.DownloadError, &m.DownloadAttempts,
		&m.CreatedAt, &m.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return m, err
}

// GetByMsgIDWithContext returns media with denormalized fields from zpMessages (chatJid, fromMe, caption)
func (r *MediaRepository) GetByMsgIDWithContext(ctx context.Context, sessionID, msgID string) (*model.Media, error) {
	m := &model.Media{}
	err := r.pool.QueryRow(ctx, `
		SELECT 
			m."id", m."sessionId", m."msgId", m."mediaType", COALESCE(m."mimeType", ''), m."fileSize", COALESCE(m."fileName", ''),
			COALESCE(m."waDirectPath", ''), m."waMediaKey", m."waFileSHA256", m."waFileEncSHA256", m."waMediaKeyTimestamp",
			COALESCE(m."width", 0), COALESCE(m."height", 0), COALESCE(m."duration", 0),
			COALESCE(m."storageKey", ''), COALESCE(m."storageUrl", ''), m."storedAt",
			COALESCE(m."thumbnailKey", ''), COALESCE(m."thumbnailUrl", ''),
			COALESCE(m."downloaded", false), COALESCE(m."downloadError", ''), COALESCE(m."downloadAttempts", 0),
			m."createdAt", m."updatedAt",
			msg."chatJid", msg."fromMe", COALESCE(msg."content", ''), COALESCE(msg."pushName", '')
		FROM "onZapMedia" m
		JOIN "onZapMessage" msg ON msg."sessionId" = m."sessionId" AND msg."msgId" = m."msgId"
		WHERE m."sessionId" = $1 AND m."msgId" = $2`,
		sessionID, msgID,
	).Scan(
		&m.ID, &m.SessionID, &m.MsgID, &m.MediaType, &m.MimeType, &m.FileSize, &m.FileName,
		&m.WADirectPath, &m.WAMediaKey, &m.WAFileSHA256, &m.WAFileEncSHA256, &m.WAMediaKeyTimestamp,
		&m.Width, &m.Height, &m.Duration,
		&m.StorageKey, &m.StorageURL, &m.StoredAt,
		&m.ThumbnailKey, &m.ThumbnailURL,
		&m.Downloaded, &m.DownloadError, &m.DownloadAttempts,
		&m.CreatedAt, &m.UpdatedAt,
		&m.ChatJID, &m.FromMe, &m.Caption, &m.PushName,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return m, err
}

func (r *MediaRepository) GetPendingDownloads(ctx context.Context, sessionID string, limit int) ([]*model.Media, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId", "msgId", "mediaType", COALESCE("mimeType", ''), "fileSize", COALESCE("fileName", ''),
			COALESCE("waDirectPath", ''), "waMediaKey", "waFileSHA256", "waFileEncSHA256", "waMediaKeyTimestamp",
			COALESCE("width", 0), COALESCE("height", 0), COALESCE("duration", 0),
			COALESCE("storageKey", ''), COALESCE("storageUrl", ''), "storedAt",
			COALESCE("thumbnailKey", ''), COALESCE("thumbnailUrl", ''),
			COALESCE("downloaded", false), COALESCE("downloadError", ''), COALESCE("downloadAttempts", 0),
			"createdAt", "updatedAt"
		FROM "onZapMedia"
		WHERE "sessionId" = $1 
			AND "downloaded" = false 
			AND "waDirectPath" IS NOT NULL 
			AND "waDirectPath" != ''
			AND "downloadAttempts" < 3
		ORDER BY "createdAt" ASC
		LIMIT $2`,
		sessionID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var medias []*model.Media
	for rows.Next() {
		m := &model.Media{}
		err := rows.Scan(
			&m.ID, &m.SessionID, &m.MsgID, &m.MediaType, &m.MimeType, &m.FileSize, &m.FileName,
			&m.WADirectPath, &m.WAMediaKey, &m.WAFileSHA256, &m.WAFileEncSHA256, &m.WAMediaKeyTimestamp,
			&m.Width, &m.Height, &m.Duration,
			&m.StorageKey, &m.StorageURL, &m.StoredAt,
			&m.ThumbnailKey, &m.ThumbnailURL,
			&m.Downloaded, &m.DownloadError, &m.DownloadAttempts,
			&m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		medias = append(medias, m)
	}

	return medias, rows.Err()
}

func (r *MediaRepository) UpdateDownloadStatus(ctx context.Context, id string, downloaded bool, storageKey, storageURL, downloadError string) error {
	now := time.Now()
	var storedAt *time.Time
	if downloaded {
		storedAt = &now
	}

	_, err := r.pool.Exec(ctx, `
		UPDATE "onZapMedia"
		SET "downloaded" = $2, 
			"storageKey" = $3, 
			"storageUrl" = $4, 
			"storedAt" = $5,
			"downloadError" = $6,
			"downloadAttempts" = "downloadAttempts" + 1,
			"updatedAt" = $7
		WHERE "id" = $1`,
		id, downloaded, storageKey, storageURL, storedAt, downloadError, now,
	)
	return err
}

func (r *MediaRepository) IncrementDownloadAttempts(ctx context.Context, id string, errorMsg string) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onZapMedia"
		SET "downloadAttempts" = "downloadAttempts" + 1,
			"downloadError" = $2,
			"updatedAt" = $3
		WHERE "id" = $1`,
		id, errorMsg, now,
	)
	return err
}

// UpdateDirectPath updates the direct path for a media after a successful MediaRetry
func (r *MediaRepository) UpdateDirectPath(ctx context.Context, sessionID, msgID, newDirectPath string) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onZapMedia"
		SET "waDirectPath" = $3,
			"downloadError" = NULL,
			"updatedAt" = $4
		WHERE "sessionId" = $1 AND "msgId" = $2`,
		sessionID, msgID, newDirectPath, now,
	)
	return err
}

// MarkAsRetryRequested marks media as having a retry request sent
func (r *MediaRepository) MarkAsRetryRequested(ctx context.Context, id string) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "onZapMedia"
		SET "downloadError" = 'retry_requested',
			"updatedAt" = $2
		WHERE "id" = $1`,
		id, now,
	)
	return err
}

// GetPendingRetries gets media that needs retry request (failed with 404/410)
func (r *MediaRepository) GetPendingRetries(ctx context.Context, sessionID string, limit int) ([]*model.Media, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId", "msgId", "mediaType", COALESCE("mimeType", ''), "fileSize", COALESCE("fileName", ''),
			COALESCE("waDirectPath", ''), "waMediaKey", "waFileSHA256", "waFileEncSHA256", "waMediaKeyTimestamp",
			COALESCE("width", 0), COALESCE("height", 0), COALESCE("duration", 0),
			COALESCE("storageKey", ''), COALESCE("storageUrl", ''), "storedAt",
			COALESCE("thumbnailKey", ''), COALESCE("thumbnailUrl", ''),
			COALESCE("downloaded", false), COALESCE("downloadError", ''), COALESCE("downloadAttempts", 0),
			"createdAt", "updatedAt"
		FROM "onZapMedia"
		WHERE "sessionId" = $1 
			AND "downloaded" = false 
			AND ("downloadError" LIKE '%404%' OR "downloadError" LIKE '%410%' OR "downloadError" LIKE '%not found%')
			AND "downloadError" NOT LIKE '%retry_requested%'
			AND "downloadAttempts" < 5
		ORDER BY "createdAt" ASC
		LIMIT $2`,
		sessionID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var medias []*model.Media
	for rows.Next() {
		m := &model.Media{}
		err := rows.Scan(
			&m.ID, &m.SessionID, &m.MsgID, &m.MediaType, &m.MimeType, &m.FileSize, &m.FileName,
			&m.WADirectPath, &m.WAMediaKey, &m.WAFileSHA256, &m.WAFileEncSHA256, &m.WAMediaKeyTimestamp,
			&m.Width, &m.Height, &m.Duration,
			&m.StorageKey, &m.StorageURL, &m.StoredAt,
			&m.ThumbnailKey, &m.ThumbnailURL,
			&m.Downloaded, &m.DownloadError, &m.DownloadAttempts,
			&m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		medias = append(medias, m)
	}

	return medias, rows.Err()
}

func (r *MediaRepository) GetBySessionID(ctx context.Context, sessionID string, limit, offset int) ([]*model.Media, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId", "msgId", "mediaType", COALESCE("mimeType", ''), "fileSize", COALESCE("fileName", ''),
			COALESCE("waDirectPath", ''), "waMediaKey", "waFileSHA256", "waFileEncSHA256", "waMediaKeyTimestamp",
			COALESCE("width", 0), COALESCE("height", 0), COALESCE("duration", 0),
			COALESCE("storageKey", ''), COALESCE("storageUrl", ''), "storedAt",
			COALESCE("thumbnailKey", ''), COALESCE("thumbnailUrl", ''),
			COALESCE("downloaded", false), COALESCE("downloadError", ''), COALESCE("downloadAttempts", 0),
			"createdAt", "updatedAt"
		FROM "onZapMedia"
		WHERE "sessionId" = $1
		ORDER BY "createdAt" DESC
		LIMIT $2 OFFSET $3`,
		sessionID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var medias []*model.Media
	for rows.Next() {
		m := &model.Media{}
		err := rows.Scan(
			&m.ID, &m.SessionID, &m.MsgID, &m.MediaType, &m.MimeType, &m.FileSize, &m.FileName,
			&m.WADirectPath, &m.WAMediaKey, &m.WAFileSHA256, &m.WAFileEncSHA256, &m.WAMediaKeyTimestamp,
			&m.Width, &m.Height, &m.Duration,
			&m.StorageKey, &m.StorageURL, &m.StoredAt,
			&m.ThumbnailKey, &m.ThumbnailURL,
			&m.Downloaded, &m.DownloadError, &m.DownloadAttempts,
			&m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		medias = append(medias, m)
	}

	return medias, rows.Err()
}
