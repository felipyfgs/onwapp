-- Migration: 003_messages.sql
-- Table: onZapMessage
-- Description: WhatsApp messages with full metadata and delivery tracking
-- Dependencies: onZapSession (002)

CREATE TABLE IF NOT EXISTS "onZapMessage" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "onZapSession"("id") ON DELETE CASCADE,
    "msgId" VARCHAR(255) NOT NULL,
    "chatJid" VARCHAR(255) NOT NULL,
    "senderJid" VARCHAR(255),
    "timestamp" TIMESTAMPTZ NOT NULL,
    "pushName" VARCHAR(255),
    "senderAlt" VARCHAR(255),
    "serverId" BIGINT,
    "verifiedName" VARCHAR(255),
    
    -- Message Classification
    "type" VARCHAR(50) NOT NULL,
    "mediaType" VARCHAR(50),
    "category" VARCHAR(50),
    "content" TEXT,
    
    -- Flags
    "fromMe" BOOLEAN NOT NULL DEFAULT FALSE,
    "isGroup" BOOLEAN NOT NULL DEFAULT FALSE,
    "ephemeral" BOOLEAN NOT NULL DEFAULT FALSE,
    "viewOnce" BOOLEAN NOT NULL DEFAULT FALSE,
    "isEdit" BOOLEAN NOT NULL DEFAULT FALSE,
    "broadcast" BOOLEAN DEFAULT FALSE,
    
    -- References
    "editTargetId" VARCHAR(255),
    "quotedId" VARCHAR(255),
    "quotedSender" VARCHAR(255),
    
    -- Delivery Status
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "deliveredAt" TIMESTAMPTZ,
    "readAt" TIMESTAMPTZ,
    
    -- Chatwoot Integration
    "cwMsgId" INTEGER,
    "cwConvId" INTEGER,
    "cwSourceId" TEXT,
    
    -- History Sync Fields
    "msgOrderID" BIGINT,
    "stubType" INTEGER,
    "stubParams" TEXT[],
    "messageSecret" BYTEA,
    "revokeTimestamp" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    
    -- Metadata
    "reactions" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "rawEvent" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "onZapMessage_sessionId_msgId_unique" UNIQUE ("sessionId", "msgId")
);

COMMENT ON TABLE "onZapMessage" IS 'WhatsApp messages with full metadata and delivery tracking';
COMMENT ON COLUMN "onZapMessage"."serverId" IS 'WhatsApp server sequence ID for precise ordering';
COMMENT ON COLUMN "onZapMessage"."verifiedName" IS 'Business verified name (if sender is verified)';
COMMENT ON COLUMN "onZapMessage"."status" IS 'Delivery: pending, sent, delivered, read, played, failed';
COMMENT ON COLUMN "onZapMessage"."msgOrderID" IS 'Server-assigned sequence for precise History Sync ordering';
COMMENT ON COLUMN "onZapMessage"."stubType" IS 'System message type (1=revoke, 28=add, 31=remove, 132=delete)';
COMMENT ON COLUMN "onZapMessage"."stubParams" IS 'Parameters for system messages (JIDs array)';
COMMENT ON COLUMN "onZapMessage"."messageSecret" IS 'Decryption key for view-once messages';
COMMENT ON COLUMN "onZapMessage"."revokeTimestamp" IS 'When message was deleted for everyone';
COMMENT ON COLUMN "onZapMessage"."expiresAt" IS 'Expiration time for ephemeral/status messages';
COMMENT ON COLUMN "onZapMessage"."broadcast" IS 'True for broadcast list messages';
