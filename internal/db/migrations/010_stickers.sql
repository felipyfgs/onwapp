-- Migration: 010_stickers.sql
-- Table: zpStickers
-- Description: Frequently used stickers from History Sync
-- Dependencies: zpSessions (002)

CREATE TABLE IF NOT EXISTS "zpStickers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    
    -- WhatsApp Media Identifiers
    "waFileSHA256" BYTEA NOT NULL,
    "waFileEncSHA256" BYTEA,
    "waMediaKey" BYTEA,
    "waDirectPath" TEXT,
    
    -- Sticker Metadata
    "mimeType" VARCHAR(100) DEFAULT 'image/webp',
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    
    -- Usage Statistics
    "weight" REAL DEFAULT 0,
    "lastUsedAt" TIMESTAMPTZ,
    
    -- Sticker Flags
    "isLottie" BOOLEAN NOT NULL DEFAULT FALSE,
    "isAvatar" BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Storage Info (MinIO/S3)
    "storageKey" VARCHAR(500),
    "storageUrl" TEXT,
    
    -- Download Status
    "downloaded" BOOLEAN NOT NULL DEFAULT FALSE,
    "downloadError" TEXT,
    "downloadAttempts" INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    "syncedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "zpStickers_session_hash_unique" UNIQUE ("sessionId", "waFileSHA256")
);

COMMENT ON TABLE "zpStickers" IS 'Frequently used stickers from History Sync with usage statistics';
COMMENT ON COLUMN "zpStickers"."weight" IS 'Usage frequency score - higher means more frequently used';
COMMENT ON COLUMN "zpStickers"."isLottie" IS 'True for animated Lottie stickers';
