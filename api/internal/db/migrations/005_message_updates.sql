-- Migration: 005_message_updates.sql
-- Table: onWappMessageUpdate
-- Description: Audit trail of message changes (reactions, status, edits, deletes)
-- Dependencies: onWappSession (002)

CREATE TABLE IF NOT EXISTS "onWappMessageUpdate" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "onWappSession"("id") ON DELETE CASCADE,
    "msgId" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "actor" VARCHAR(255),
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "eventAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onWappMessageUpdate" IS 'Audit trail of message changes (reactions, status, edits, deletes)';
COMMENT ON COLUMN "onWappMessageUpdate"."type" IS 'reaction, delivered, read, played, edit, delete';
COMMENT ON COLUMN "onWappMessageUpdate"."actor" IS 'JID of who performed the action';
COMMENT ON COLUMN "onWappMessageUpdate"."data" IS 'Type-specific JSON data';
