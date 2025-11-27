-- Message updates history (edits, deletions, reactions, status changes)
CREATE TABLE IF NOT EXISTS "zpMessageUpdates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "msgId" VARCHAR(255) NOT NULL,        -- WhatsApp message ID
    "type" VARCHAR(50) NOT NULL,          -- edit, delete, reaction_add, reaction_remove, status
    "actor" VARCHAR(255),                 -- Who made the update (JID)
    "data" JSONB DEFAULT '{}'::jsonb,     -- {emoji, content, status, etc}
    "eventAt" TIMESTAMP WITH TIME ZONE,   -- When it happened (WhatsApp)
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_sessionId" ON "zpMessageUpdates"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_msgId" ON "zpMessageUpdates"("msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_session_msg" ON "zpMessageUpdates"("sessionId", "msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_type" ON "zpMessageUpdates"("type");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_eventAt" ON "zpMessageUpdates"("eventAt" DESC);
