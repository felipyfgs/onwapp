-- Migration: 017_chat_settings.sql
-- Description: Add archived, pinned, muted fields to onWappChat

ALTER TABLE "onWappChat" 
ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "muted" TIMESTAMPTZ;

-- Index for sorting by pinned status
CREATE INDEX IF NOT EXISTS "idx_onWappChat_pinned" ON "onWappChat" ("sessionId", "pinned" DESC, "conversationTimestamp" DESC);
