-- Migration: 001_create_sessions_table.sql
-- Table: zpSessions
-- Description: WhatsApp sessions with device credentials and connection state

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "zpSessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "deviceJid" VARCHAR(255),
    "phone" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_zpSessions_status" ON "zpSessions"("status");
CREATE INDEX IF NOT EXISTS "idx_zpSessions_phone" ON "zpSessions"("phone") WHERE "phone" IS NOT NULL;

COMMENT ON TABLE "zpSessions" IS 'WhatsApp sessions with device credentials and connection state';
COMMENT ON COLUMN "zpSessions"."name" IS 'Unique session identifier (used in API routes)';
COMMENT ON COLUMN "zpSessions"."deviceJid" IS 'WhatsApp device JID after connection';
COMMENT ON COLUMN "zpSessions"."status" IS 'Connection status: disconnected, connecting, connected';
