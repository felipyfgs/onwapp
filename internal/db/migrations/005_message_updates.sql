-- Migration: 005_message_updates.sql
-- Table: zpMessageUpdates
-- Description: Audit trail of message changes (reactions, status, edits, deletes)
-- Dependencies: zpSessions (002)

CREATE TABLE IF NOT EXISTS "zpMessageUpdates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "msgId" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "actor" VARCHAR(255),
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "eventAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "zpMessageUpdates" IS 'Audit trail of message changes (reactions, status, edits, deletes)';
COMMENT ON COLUMN "zpMessageUpdates"."type" IS 'reaction, delivered, read, played, edit, delete';
COMMENT ON COLUMN "zpMessageUpdates"."actor" IS 'JID of who performed the action';
COMMENT ON COLUMN "zpMessageUpdates"."data" IS 'Type-specific JSON data';
