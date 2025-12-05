-- Migration: 013_indexes.sql
-- Description: Performance indexes for all tables
-- Dependencies: All table migrations (001-011)

-- ============================================================================
-- onZapSession INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onZapSession_status" ON "onZapSession"("status");
CREATE INDEX IF NOT EXISTS "idx_onZapSession_phone" ON "onZapSession"("phone") WHERE "phone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onZapSession_deviceJid" ON "onZapSession"("deviceJid") WHERE "deviceJid" IS NOT NULL;

-- ============================================================================
-- onZapMessage INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_chat_timeline" ON "onZapMessage"("sessionId", "chatJid", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_serverId" ON "onZapMessage"("serverId") WHERE "serverId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_status" ON "onZapMessage"("status");
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_type" ON "onZapMessage"("type");
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_msgId" ON "onZapMessage"("msgId");
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_unread" ON "onZapMessage"("sessionId", "chatJid") WHERE "status" IN ('sent', 'delivered');
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_reactions" ON "onZapMessage" USING GIN ("reactions") WHERE jsonb_array_length("reactions") > 0;
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_chat_direction" ON "onZapMessage"("sessionId", "chatJid", "fromMe", "timestamp" DESC);

-- Chatwoot indexes
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_cwMsgId" ON "onZapMessage"("sessionId", "cwMsgId") WHERE "cwMsgId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_cwSourceId" ON "onZapMessage"("cwSourceId") WHERE "cwSourceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_cwConvId" ON "onZapMessage"("sessionId", "cwConvId") WHERE "cwConvId" IS NOT NULL;

-- History Sync indexes
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_order" ON "onZapMessage"("sessionId", "chatJid", "msgOrderID" DESC NULLS LAST) WHERE "msgOrderID" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_stubType" ON "onZapMessage"("sessionId", "stubType") WHERE "stubType" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_expires" ON "onZapMessage"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onZapMessage_status_broadcast" ON "onZapMessage"("sessionId", "timestamp" DESC) WHERE "chatJid" = 'status@broadcast';

-- ============================================================================
-- onZapWebhook INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onZapWebhook_enabled" ON "onZapWebhook"("enabled") WHERE "enabled" = TRUE;

-- ============================================================================
-- onZapMessageUpdate INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onZapMsgUpdate_session_msg" ON "onZapMessageUpdate"("sessionId", "msgId");
CREATE INDEX IF NOT EXISTS "idx_onZapMsgUpdate_type" ON "onZapMessageUpdate"("type");
CREATE INDEX IF NOT EXISTS "idx_onZapMsgUpdate_eventAt" ON "onZapMessageUpdate"("eventAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_onZapMsgUpdate_msgId" ON "onZapMessageUpdate"("msgId");
CREATE INDEX IF NOT EXISTS "idx_onZapMsgUpdate_reactions" ON "onZapMessageUpdate"("sessionId", "msgId") WHERE "type" = 'reaction';
CREATE INDEX IF NOT EXISTS "idx_onZapMsgUpdate_delivery" ON "onZapMessageUpdate"("sessionId", "msgId") WHERE "type" IN ('delivered', 'read', 'played');

-- ============================================================================
-- onZapChatwoot INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onZapChatwoot_enabled" ON "onZapChatwoot"("enabled") WHERE "enabled" = TRUE;

-- ============================================================================
-- onZapMedia INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onZapMedia_pending_downloads" ON "onZapMedia"("sessionId", "createdAt") 
    WHERE "downloaded" = FALSE AND "waDirectPath" IS NOT NULL AND "downloadAttempts" < 3;
CREATE INDEX IF NOT EXISTS "idx_onZapMedia_mediaType" ON "onZapMedia"("mediaType");
CREATE INDEX IF NOT EXISTS "idx_onZapMedia_msgId" ON "onZapMedia"("msgId");
CREATE INDEX IF NOT EXISTS "idx_onZapMedia_storage" ON "onZapMedia"("sessionId", "storageKey") WHERE "storageKey" IS NOT NULL;

-- ============================================================================
-- onZapChat INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onZapChat_session_timestamp" ON "onZapChat"("sessionId", "conversationTimestamp" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_onZapChat_unread" ON "onZapChat"("sessionId", "unreadCount") WHERE "unreadCount" > 0;
CREATE INDEX IF NOT EXISTS "idx_onZapChat_ephemeral" ON "onZapChat"("sessionId") WHERE "ephemeralExpiration" > 0;


