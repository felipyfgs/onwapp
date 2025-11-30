-- Migration: 006_create_media_table.sql
-- Table: zpMedia
-- Description: Media files attached to WhatsApp messages
-- Dependencies: zpSessions, zpMessages
-- Note: chatJid, fromMe, caption obtained via JOIN with zpMessages (no redundancy)

CREATE TABLE IF NOT EXISTS "zpMedia" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "msgId" VARCHAR(255) NOT NULL,
    
    -- Media Classification
    "mediaType" VARCHAR(50) NOT NULL,
    "mimeType" VARCHAR(100),
    "fileSize" BIGINT,
    "fileName" VARCHAR(500),
    
    -- WhatsApp Download Info (required to download from WA servers)
    "waDirectPath" TEXT,
    "waMediaKey" BYTEA,
    "waFileSHA256" BYTEA,
    "waFileEncSHA256" BYTEA,
    "waMediaKeyTimestamp" BIGINT,
    
    -- Media Dimensions (images/videos/audio)
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    
    -- Storage Info (MinIO/S3)
    "storageKey" VARCHAR(500),
    "storageUrl" TEXT,
    "storedAt" TIMESTAMPTZ,
    
    -- Thumbnail
    "thumbnailKey" VARCHAR(500),
    "thumbnailUrl" TEXT,
    
    -- Download Status
    "downloaded" BOOLEAN NOT NULL DEFAULT FALSE,
    "downloadError" TEXT,
    "downloadAttempts" INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "zpMedia_sessionId_msgId_unique" UNIQUE ("sessionId", "msgId")
);

-- Pending downloads optimization
CREATE INDEX IF NOT EXISTS "idx_zpMedia_pending_downloads" 
    ON "zpMedia"("sessionId", "createdAt") 
    WHERE "downloaded" = FALSE AND "waDirectPath" IS NOT NULL AND "downloadAttempts" < 3;

-- Media type filtering
CREATE INDEX IF NOT EXISTS "idx_zpMedia_mediaType" ON "zpMedia"("mediaType");

COMMENT ON TABLE "zpMedia" IS 'Media files attached to WhatsApp messages. Use JOIN with zpMessages for chatJid/fromMe/caption.';
COMMENT ON COLUMN "zpMedia"."waDirectPath" IS 'WhatsApp CDN path for downloading';
COMMENT ON COLUMN "zpMedia"."waMediaKey" IS 'Encryption key for media decryption';
COMMENT ON COLUMN "zpMedia"."downloadAttempts" IS 'Number of download attempts (max 3)';
