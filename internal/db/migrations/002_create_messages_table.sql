-- Migration: 002_create_messages_table.sql
-- Table: zpMessages
-- Description: WhatsApp messages with full metadata and delivery tracking
-- Dependencies: zpSessions

CREATE TABLE IF NOT EXISTS "zpMessages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "msgId" VARCHAR(255) NOT NULL,
    "chatJid" VARCHAR(255) NOT NULL,
    "senderJid" VARCHAR(255),
    "timestamp" TIMESTAMPTZ NOT NULL,
    "pushName" VARCHAR(255),
    "senderAlt" VARCHAR(255),
    "serverId" BIGINT,
    "verifiedName" VARCHAR(255),
    "type" VARCHAR(50) NOT NULL,
    "mediaType" VARCHAR(50),
    "category" VARCHAR(50),
    "content" TEXT,
    "fromMe" BOOLEAN NOT NULL DEFAULT FALSE,
    "isGroup" BOOLEAN NOT NULL DEFAULT FALSE,
    "ephemeral" BOOLEAN NOT NULL DEFAULT FALSE,
    "viewOnce" BOOLEAN NOT NULL DEFAULT FALSE,
    "isEdit" BOOLEAN NOT NULL DEFAULT FALSE,
    "editTargetId" VARCHAR(255),
    "quotedId" VARCHAR(255),
    "quotedSender" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "deliveredAt" TIMESTAMPTZ,
    "readAt" TIMESTAMPTZ,
    "cwMsgId" INTEGER,
    "cwConvId" INTEGER,
    "cwSourceId" TEXT,
    "reactions" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "rawEvent" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zpMessages_sessionId_msgId_unique" UNIQUE ("sessionId", "msgId")
);

CREATE INDEX IF NOT EXISTS "idx_zpMessages_chat_timeline" ON "zpMessages"("sessionId", "chatJid", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_zpMessages_serverId" ON "zpMessages"("serverId") WHERE "serverId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_status" ON "zpMessages"("status");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_type" ON "zpMessages"("type");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_unread" ON "zpMessages"("sessionId", "chatJid") WHERE "status" IN ('sent', 'delivered');
CREATE INDEX IF NOT EXISTS "idx_zpMessages_reactions" ON "zpMessages" USING GIN ("reactions") WHERE jsonb_array_length("reactions") > 0;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_cwMsgId" ON "zpMessages"("sessionId", "cwMsgId") WHERE "cwMsgId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_cwSourceId" ON "zpMessages"("cwSourceId") WHERE "cwSourceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_cwConvId" ON "zpMessages"("sessionId", "cwConvId") WHERE "cwConvId" IS NOT NULL;

COMMENT ON TABLE "zpMessages" IS 'WhatsApp messages with full metadata and delivery tracking';
COMMENT ON COLUMN "zpMessages"."serverId" IS 'WhatsApp server sequence ID for precise ordering';
COMMENT ON COLUMN "zpMessages"."verifiedName" IS 'Business verified name (if sender is verified)';
COMMENT ON COLUMN "zpMessages"."status" IS 'Delivery: pending, sent, delivered, read, played, failed';
