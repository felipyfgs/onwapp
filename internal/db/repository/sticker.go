package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"zpwoot/internal/model"
)

type StickerRepository struct {
	pool *pgxpool.Pool
}

func NewStickerRepository(pool *pgxpool.Pool) *StickerRepository {
	return &StickerRepository{pool: pool}
}

func (r *StickerRepository) Save(ctx context.Context, s *model.Sticker) (string, error) {
	var id string
	now := time.Now()

	err := r.pool.QueryRow(ctx, `
		INSERT INTO "zpStickers" (
			"sessionId",
			"waFileSHA256", "waFileEncSHA256", "waMediaKey", "waDirectPath",
			"mimeType", "fileSize", "width", "height",
			"weight", "lastUsedAt",
			"isLottie", "isAvatar",
			"storageKey", "storageUrl",
			"downloaded", "downloadError", "downloadAttempts",
			"syncedAt", "updatedAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
		ON CONFLICT ("sessionId", "waFileSHA256") DO UPDATE SET
			"weight" = "zpStickers"."weight" + EXCLUDED."weight",
			"lastUsedAt" = GREATEST(EXCLUDED."lastUsedAt", "zpStickers"."lastUsedAt"),
			"waDirectPath" = COALESCE(EXCLUDED."waDirectPath", "zpStickers"."waDirectPath"),
			"updatedAt" = $20
		RETURNING "id"`,
		s.SessionID,
		s.WAFileSHA256, s.WAFileEncSHA256, s.WAMediaKey, s.WADirectPath,
		s.MimeType, s.FileSize, s.Width, s.Height,
		s.Weight, s.LastUsedAt,
		s.IsLottie, s.IsAvatar,
		s.StorageKey, s.StorageURL,
		s.Downloaded, s.DownloadError, s.DownloadAttempts,
		now, now,
	).Scan(&id)

	if err == pgx.ErrNoRows {
		return "", nil
	}
	return id, err
}

func (r *StickerRepository) SaveBatch(ctx context.Context, stickers []*model.Sticker) (int, error) {
	if len(stickers) == 0 {
		return 0, nil
	}

	now := time.Now()
	saved := 0

	batch := &pgx.Batch{}
	for _, s := range stickers {
		batch.Queue(`
			INSERT INTO "zpStickers" (
				"sessionId",
				"waFileSHA256", "waFileEncSHA256", "waMediaKey", "waDirectPath",
				"mimeType", "fileSize", "width", "height",
				"weight", "lastUsedAt",
				"isLottie", "isAvatar",
				"downloaded", "syncedAt", "updatedAt"
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
			ON CONFLICT ("sessionId", "waFileSHA256") DO UPDATE SET
				"weight" = "zpStickers"."weight" + EXCLUDED."weight",
				"lastUsedAt" = GREATEST(EXCLUDED."lastUsedAt", "zpStickers"."lastUsedAt"),
				"waDirectPath" = COALESCE(EXCLUDED."waDirectPath", "zpStickers"."waDirectPath"),
				"updatedAt" = $16`,
			s.SessionID,
			s.WAFileSHA256, s.WAFileEncSHA256, s.WAMediaKey, s.WADirectPath,
			s.MimeType, s.FileSize, s.Width, s.Height,
			s.Weight, s.LastUsedAt,
			s.IsLottie, s.IsAvatar,
			false, now, now,
		)
	}

	results := r.pool.SendBatch(ctx, batch)
	defer func() { _ = results.Close() }()

	for range stickers {
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

func (r *StickerRepository) GetBySession(ctx context.Context, sessionID string, limit, offset int) ([]*model.Sticker, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId",
			"waFileSHA256", "waFileEncSHA256", "waMediaKey", COALESCE("waDirectPath", ''),
			COALESCE("mimeType", ''), COALESCE("fileSize", 0), COALESCE("width", 0), COALESCE("height", 0),
			COALESCE("weight", 0), "lastUsedAt",
			"isLottie", "isAvatar",
			COALESCE("storageKey", ''), COALESCE("storageUrl", ''),
			COALESCE("downloaded", false), COALESCE("downloadError", ''), COALESCE("downloadAttempts", 0),
			"syncedAt", "updatedAt"
		FROM "zpStickers"
		WHERE "sessionId" = $1
		ORDER BY "weight" DESC, "lastUsedAt" DESC NULLS LAST
		LIMIT $2 OFFSET $3`,
		sessionID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanStickers(rows)
}

func (r *StickerRepository) GetPendingDownloads(ctx context.Context, sessionID string, limit int) ([]*model.Sticker, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId",
			"waFileSHA256", "waFileEncSHA256", "waMediaKey", COALESCE("waDirectPath", ''),
			COALESCE("mimeType", ''), COALESCE("fileSize", 0), COALESCE("width", 0), COALESCE("height", 0),
			COALESCE("weight", 0), "lastUsedAt",
			"isLottie", "isAvatar",
			COALESCE("storageKey", ''), COALESCE("storageUrl", ''),
			COALESCE("downloaded", false), COALESCE("downloadError", ''), COALESCE("downloadAttempts", 0),
			"syncedAt", "updatedAt"
		FROM "zpStickers"
		WHERE "sessionId" = $1
			AND "downloaded" = false
			AND "waDirectPath" IS NOT NULL
			AND "waDirectPath" != ''
			AND "downloadAttempts" < 3
		ORDER BY "weight" DESC
		LIMIT $2`,
		sessionID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanStickers(rows)
}

func (r *StickerRepository) UpdateDownloadStatus(ctx context.Context, id string, downloaded bool, storageKey, storageURL, downloadError string) error {
	now := time.Now()

	_, err := r.pool.Exec(ctx, `
		UPDATE "zpStickers"
		SET "downloaded" = $2, 
			"storageKey" = $3, 
			"storageUrl" = $4, 
			"downloadError" = $5,
			"downloadAttempts" = "downloadAttempts" + 1,
			"updatedAt" = $6
		WHERE "id" = $1`,
		id, downloaded, storageKey, storageURL, downloadError, now,
	)
	return err
}

func (r *StickerRepository) IncrementDownloadAttempts(ctx context.Context, id string, errorMsg string) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE "zpStickers"
		SET "downloadAttempts" = "downloadAttempts" + 1,
			"downloadError" = $2,
			"updatedAt" = $3
		WHERE "id" = $1`,
		id, errorMsg, now,
	)
	return err
}

func (r *StickerRepository) GetBySHA256(ctx context.Context, sessionID string, sha256 []byte) (*model.Sticker, error) {
	s := &model.Sticker{}
	err := r.pool.QueryRow(ctx, `
		SELECT 
			"id", "sessionId",
			"waFileSHA256", "waFileEncSHA256", "waMediaKey", COALESCE("waDirectPath", ''),
			COALESCE("mimeType", ''), COALESCE("fileSize", 0), COALESCE("width", 0), COALESCE("height", 0),
			COALESCE("weight", 0), "lastUsedAt",
			"isLottie", "isAvatar",
			COALESCE("storageKey", ''), COALESCE("storageUrl", ''),
			COALESCE("downloaded", false), COALESCE("downloadError", ''), COALESCE("downloadAttempts", 0),
			"syncedAt", "updatedAt"
		FROM "zpStickers"
		WHERE "sessionId" = $1 AND "waFileSHA256" = $2`,
		sessionID, sha256,
	).Scan(
		&s.ID, &s.SessionID,
		&s.WAFileSHA256, &s.WAFileEncSHA256, &s.WAMediaKey, &s.WADirectPath,
		&s.MimeType, &s.FileSize, &s.Width, &s.Height,
		&s.Weight, &s.LastUsedAt,
		&s.IsLottie, &s.IsAvatar,
		&s.StorageKey, &s.StorageURL,
		&s.Downloaded, &s.DownloadError, &s.DownloadAttempts,
		&s.SyncedAt, &s.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return s, err
}

func (r *StickerRepository) scanStickers(rows pgx.Rows) ([]*model.Sticker, error) {
	var stickers []*model.Sticker
	for rows.Next() {
		s := &model.Sticker{}
		err := rows.Scan(
			&s.ID, &s.SessionID,
			&s.WAFileSHA256, &s.WAFileEncSHA256, &s.WAMediaKey, &s.WADirectPath,
			&s.MimeType, &s.FileSize, &s.Width, &s.Height,
			&s.Weight, &s.LastUsedAt,
			&s.IsLottie, &s.IsAvatar,
			&s.StorageKey, &s.StorageURL,
			&s.Downloaded, &s.DownloadError, &s.DownloadAttempts,
			&s.SyncedAt, &s.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		stickers = append(stickers, s)
	}
	return stickers, rows.Err()
}

func (r *StickerRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM "zpStickers" WHERE "id" = $1`, id)
	return err
}

func (r *StickerRepository) GetTopStickers(ctx context.Context, sessionID string, limit int) ([]*model.Sticker, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT 
			"id", "sessionId",
			"waFileSHA256", "waFileEncSHA256", "waMediaKey", COALESCE("waDirectPath", ''),
			COALESCE("mimeType", ''), COALESCE("fileSize", 0), COALESCE("width", 0), COALESCE("height", 0),
			COALESCE("weight", 0), "lastUsedAt",
			"isLottie", "isAvatar",
			COALESCE("storageKey", ''), COALESCE("storageUrl", ''),
			COALESCE("downloaded", false), COALESCE("downloadError", ''), COALESCE("downloadAttempts", 0),
			"syncedAt", "updatedAt"
		FROM "zpStickers"
		WHERE "sessionId" = $1 AND "downloaded" = true
		ORDER BY "weight" DESC
		LIMIT $2`,
		sessionID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanStickers(rows)
}
