-- =============================================================================
-- zpMessageUpdates: Audit trail for message changes
-- =============================================================================
-- Tracks: reactions, delivery status, edits, deletes
-- Types: reaction, delivered, read, played, edit, delete

CREATE TABLE IF NOT EXISTS "zpMessageUpdates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "msgId" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "actor" VARCHAR(255),
    "data" JSONB DEFAULT '{}'::jsonb,
    "eventAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_session_msg" 
    ON "zpMessageUpdates"("sessionId", "msgId");

-- Type filtering
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_type" 
    ON "zpMessageUpdates"("type");

-- Timeline
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_eventAt" 
    ON "zpMessageUpdates"("eventAt" DESC);

-- Reactions sync (partial index)
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_reactions" 
    ON "zpMessageUpdates"("sessionId", "msgId") 
    WHERE "type" = 'reaction';

-- Delivery tracking (partial index)
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_delivery" 
    ON "zpMessageUpdates"("sessionId", "msgId") 
    WHERE "type" IN ('delivered', 'read', 'played');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE "zpMessageUpdates" IS 'Audit trail of message changes (reactions, status, edits)';
COMMENT ON COLUMN "zpMessageUpdates"."type" IS 'reaction, delivered, read, played, edit, delete';
COMMENT ON COLUMN "zpMessageUpdates"."actor" IS 'JID of who performed the action';
COMMENT ON COLUMN "zpMessageUpdates"."data" IS 'Type-specific JSON data';
