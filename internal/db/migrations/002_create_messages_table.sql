CREATE TABLE IF NOT EXISTS "zpMessages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    
    -- Core identifiers (from whatsmeow MessageInfo)
    "messageId" VARCHAR(255) NOT NULL,
    "chatJid" VARCHAR(255) NOT NULL,
    "senderJid" VARCHAR(255),
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Sender info
    "pushName" VARCHAR(255),
    "senderAlt" VARCHAR(255),
    
    -- Message type (from Info.Type)
    "type" VARCHAR(50) NOT NULL,
    "mediaType" VARCHAR(50),
    "category" VARCHAR(50),
    
    -- Content
    "content" TEXT,
    
    -- Flags from whatsmeow
    "isFromMe" BOOLEAN DEFAULT FALSE,
    "isGroup" BOOLEAN DEFAULT FALSE,
    "isEphemeral" BOOLEAN DEFAULT FALSE,
    "isViewOnce" BOOLEAN DEFAULT FALSE,
    "isEdit" BOOLEAN DEFAULT FALSE,
    
    -- Edit info (from MsgBotInfo)
    "editTargetId" VARCHAR(255),
    
    -- Reply/Quote info (from MsgMetaInfo)
    "quotedId" VARCHAR(255),
    "quotedSender" VARCHAR(255),
    
    -- Status tracking (updated via receipts)
    "status" VARCHAR(20) DEFAULT 'sent',
    "deliveredAt" TIMESTAMP WITH TIME ZONE,
    "readAt" TIMESTAMP WITH TIME ZONE,
    
    -- Reactions: [{"emoji": "👍", "senderJid": "...", "timestamp": 123}]
    "reactions" JSONB DEFAULT '[]'::jsonb,
    
    -- Raw event JSON for full fidelity
    "rawEvent" JSONB,
    
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS "idx_zpMessages_session_message_unique" ON "zpMessages"("sessionId", "messageId");

-- Basic indexes
CREATE INDEX IF NOT EXISTS "idx_zpMessages_sessionId" ON "zpMessages"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_messageId" ON "zpMessages"("messageId");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chatJid" ON "zpMessages"("chatJid");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_timestamp" ON "zpMessages"("timestamp" DESC);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS "idx_zpMessages_isFromMe" ON "zpMessages"("isFromMe");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_isGroup" ON "zpMessages"("isGroup");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_type" ON "zpMessages"("type");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_status" ON "zpMessages"("status");

-- Composite index for chat history queries
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chat_history" ON "zpMessages"("sessionId", "chatJid", "timestamp" DESC);

-- GIN indexes for JSONB queries
CREATE INDEX IF NOT EXISTS "idx_zpMessages_reactions" ON "zpMessages" USING GIN ("reactions");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_rawEvent" ON "zpMessages" USING GIN ("rawEvent");
