-- =============================================================================
-- zpMessages: WhatsApp messages with full metadata
-- =============================================================================

CREATE TABLE IF NOT EXISTS "zpMessages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    
    -- WhatsApp Identifiers
    "msgId" VARCHAR(255) NOT NULL,
    "chatJid" VARCHAR(255) NOT NULL,
    "senderJid" VARCHAR(255),
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Sender Info
    "pushName" VARCHAR(255),
    "senderAlt" VARCHAR(255),
    "serverId" BIGINT,
    "verifiedName" VARCHAR(255),
    
    -- Message Classification
    "type" VARCHAR(50) NOT NULL,
    "mediaType" VARCHAR(50),
    "category" VARCHAR(50),
    
    -- Content
    "content" TEXT,
    
    -- Direction & Context Flags
    "fromMe" BOOLEAN DEFAULT FALSE,
    "isGroup" BOOLEAN DEFAULT FALSE,
    "ephemeral" BOOLEAN DEFAULT FALSE,
    "viewOnce" BOOLEAN DEFAULT FALSE,
    "isEdit" BOOLEAN DEFAULT FALSE,
    
    -- Edit Context
    "editTargetId" VARCHAR(255),
    
    -- Reply/Quote Context
    "quotedId" VARCHAR(255),
    "quotedSender" VARCHAR(255),
    
    -- Delivery Status
    "status" VARCHAR(20) DEFAULT 'sent',
    "deliveredAt" TIMESTAMP WITH TIME ZONE,
    "readAt" TIMESTAMP WITH TIME ZONE,
    
    -- Chatwoot Integration
    "cwMsgId" INTEGER,
    "cwConvId" INTEGER,
    "cwSourceId" TEXT,
    
    -- Reactions Array
    "reactions" JSONB DEFAULT '[]'::jsonb,
    
    -- Full Event Data
    "rawEvent" JSONB,
    
    -- Metadata
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Unique constraint (deduplication)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_zpMessages_unique" 
    ON "zpMessages"("sessionId", "msgId");

-- Primary lookups
CREATE INDEX IF NOT EXISTS "idx_zpMessages_sessionId" 
    ON "zpMessages"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_msgId" 
    ON "zpMessages"("msgId");

-- Chat timeline (most common query)
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chat_timeline" 
    ON "zpMessages"("sessionId", "chatJid", "timestamp" DESC);

-- Server ordering
CREATE INDEX IF NOT EXISTS "idx_zpMessages_serverId" 
    ON "zpMessages"("serverId") 
    WHERE "serverId" IS NOT NULL;

-- Status and type filters
CREATE INDEX IF NOT EXISTS "idx_zpMessages_status" 
    ON "zpMessages"("status");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_type" 
    ON "zpMessages"("type");

-- Unread messages (partial index)
CREATE INDEX IF NOT EXISTS "idx_zpMessages_unread" 
    ON "zpMessages"("sessionId", "chatJid") 
    WHERE "status" IN ('sent', 'delivered');

-- JSONB indexes
CREATE INDEX IF NOT EXISTS "idx_zpMessages_reactions" 
    ON "zpMessages" USING GIN ("reactions") 
    WHERE jsonb_array_length("reactions") > 0;

-- Chatwoot indexes
CREATE INDEX IF NOT EXISTS "idx_zpMessages_cwMsgId" 
    ON "zpMessages"("cwMsgId") 
    WHERE "cwMsgId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_cwSourceId" 
    ON "zpMessages"("cwSourceId") 
    WHERE "cwSourceId" IS NOT NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE "zpMessages" IS 'WhatsApp messages with full metadata and delivery tracking';
COMMENT ON COLUMN "zpMessages"."serverId" IS 'WhatsApp server sequence ID for precise ordering';
COMMENT ON COLUMN "zpMessages"."verifiedName" IS 'Business verified name (if sender is verified)';
COMMENT ON COLUMN "zpMessages"."status" IS 'Delivery: pending, sent, delivered, read, played, failed';
