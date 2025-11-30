-- Migration: 004_create_message_updates_table.sql
-- Table: zpMessageUpdates
-- Description: Audit trail of message changes (reactions, status, edits, deletes)
-- Dependencies: zpSessions

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

CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_session_msg" ON "zpMessageUpdates"("sessionId", "msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_type" ON "zpMessageUpdates"("type");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_eventAt" ON "zpMessageUpdates"("eventAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_reactions" ON "zpMessageUpdates"("sessionId", "msgId") WHERE "type" = 'reaction';
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_delivery" ON "zpMessageUpdates"("sessionId", "msgId") WHERE "type" IN ('delivered', 'read', 'played');

COMMENT ON TABLE "zpMessageUpdates" IS 'Audit trail of message changes (reactions, status, edits, deletes)';
COMMENT ON COLUMN "zpMessageUpdates"."type" IS 'reaction, delivered, read, played, edit, delete';
COMMENT ON COLUMN "zpMessageUpdates"."actor" IS 'JID of who performed the action';
COMMENT ON COLUMN "zpMessageUpdates"."data" IS 'Type-specific JSON data';
