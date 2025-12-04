-- Migration: 016_session_apikey.sql
-- Description: Add API key field to sessions for individual session authentication

ALTER TABLE "zpSessions" ADD COLUMN IF NOT EXISTS "apiKey" VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_zpSessions_apiKey" ON "zpSessions"("apiKey") WHERE "apiKey" IS NOT NULL;

COMMENT ON COLUMN "zpSessions"."apiKey" IS 'Session-specific API key for individual session authentication (optional, null = use global API key only)';
