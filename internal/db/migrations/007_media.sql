-- Migration: 007_media.sql
-- Table: onZapMedia
-- Description: Media files attached to WhatsApp messages
-- Dependencies: onZapSession (002)

CREATE TABLE IF NOT EXISTS "onZapMedia" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "onZapSession"("id") ON DELETE CASCADE,
    "msgId" VARCHAR(255) NOT NULL,
    
    -- Media Classification
    "mediaType" VARCHAR(50) NOT NULL,
    "mimeType" VARCHAR(100),
    "fileSize" BIGINT,
    "fileName" VARCHAR(500),
    
    -- WhatsApp Download Info
    "waDirectPath" TEXT,
    "waMediaKey" BYTEA,
    "waFileSHA256" BYTEA,
    "waFileEncSHA256" BYTEA,
    "waMediaKeyTimestamp" BIGINT,
    
    -- Media Dimensions
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
    
    CONSTRAINT "onZapMedia_sessionId_msgId_unique" UNIQUE ("sessionId", "msgId")
);

COMMENT ON TABLE "onZapMedia" IS 'Media files attached to WhatsApp messages';
COMMENT ON COLUMN "onZapMedia"."waDirectPath" IS 'WhatsApp CDN path for downloading';
COMMENT ON COLUMN "onZapMedia"."waMediaKey" IS 'Encryption key for media decryption';
COMMENT ON COLUMN "onZapMedia"."downloadAttempts" IS 'Number of download attempts (max 3)';
