-- Migration: 013_indexes.sql
-- Description: Performance indexes for all tables
-- Dependencies: All table migrations (001-011)

-- ============================================================================
-- onWappSession INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onWappSession_status" ON "onWappSession"("status");
CREATE INDEX IF NOT EXISTS "idx_onWappSession_phone" ON "onWappSession"("phone") WHERE "phone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onWappSession_deviceJid" ON "onWappSession"("deviceJid") WHERE "deviceJid" IS NOT NULL;

-- ============================================================================
-- onWappMessage INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_chat_timeline" ON "onWappMessage"("sessionId", "chatJid", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_serverId" ON "onWappMessage"("serverId") WHERE "serverId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_status" ON "onWappMessage"("status");
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_type" ON "onWappMessage"("type");
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_msgId" ON "onWappMessage"("msgId");
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_unread" ON "onWappMessage"("sessionId", "chatJid") WHERE "status" IN ('sent', 'delivered');
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_reactions" ON "onWappMessage" USING GIN ("reactions") WHERE jsonb_array_length("reactions") > 0;
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_chat_direction" ON "onWappMessage"("sessionId", "chatJid", "fromMe", "timestamp" DESC);

-- Chatwoot indexes
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_cwMsgId" ON "onWappMessage"("sessionId", "cwMsgId") WHERE "cwMsgId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_cwSourceId" ON "onWappMessage"("cwSourceId") WHERE "cwSourceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_cwConvId" ON "onWappMessage"("sessionId", "cwConvId") WHERE "cwConvId" IS NOT NULL;

-- History Sync indexes
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_order" ON "onWappMessage"("sessionId", "chatJid", "msgOrderID" DESC NULLS LAST) WHERE "msgOrderID" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_stubType" ON "onWappMessage"("sessionId", "stubType") WHERE "stubType" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_expires" ON "onWappMessage"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_onWappMessage_status_broadcast" ON "onWappMessage"("sessionId", "timestamp" DESC) WHERE "chatJid" = 'status@broadcast';

-- ============================================================================
-- onWappWebhook INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onWappWebhook_enabled" ON "onWappWebhook"("enabled") WHERE "enabled" = TRUE;

-- ============================================================================
-- onWappMessageUpdate INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onWappMsgUpdate_session_msg" ON "onWappMessageUpdate"("sessionId", "msgId");
CREATE INDEX IF NOT EXISTS "idx_onWappMsgUpdate_type" ON "onWappMessageUpdate"("type");
CREATE INDEX IF NOT EXISTS "idx_onWappMsgUpdate_eventAt" ON "onWappMessageUpdate"("eventAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_onWappMsgUpdate_msgId" ON "onWappMessageUpdate"("msgId");
CREATE INDEX IF NOT EXISTS "idx_onWappMsgUpdate_reactions" ON "onWappMessageUpdate"("sessionId", "msgId") WHERE "type" = 'reaction';
CREATE INDEX IF NOT EXISTS "idx_onWappMsgUpdate_delivery" ON "onWappMessageUpdate"("sessionId", "msgId") WHERE "type" IN ('delivered', 'read', 'played');

-- ============================================================================
-- onWappChatwoot INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onWappChatwoot_enabled" ON "onWappChatwoot"("enabled") WHERE "enabled" = TRUE;

-- ============================================================================
-- onWappMedia INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onWappMedia_pending_downloads" ON "onWappMedia"("sessionId", "createdAt") 
    WHERE "downloaded" = FALSE AND "waDirectPath" IS NOT NULL AND "downloadAttempts" < 3;
CREATE INDEX IF NOT EXISTS "idx_onWappMedia_mediaType" ON "onWappMedia"("mediaType");
CREATE INDEX IF NOT EXISTS "idx_onWappMedia_msgId" ON "onWappMedia"("msgId");
CREATE INDEX IF NOT EXISTS "idx_onWappMedia_storage" ON "onWappMedia"("sessionId", "storageKey") WHERE "storageKey" IS NOT NULL;

-- ============================================================================
-- onWappChat INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_onWappChat_session_timestamp" ON "onWappChat"("sessionId", "conversationTimestamp" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_onWappChat_unread" ON "onWappChat"("sessionId", "unreadCount") WHERE "unreadCount" > 0;
CREATE INDEX IF NOT EXISTS "idx_onWappChat_ephemeral" ON "onWappChat"("sessionId") WHERE "ephemeralExpiration" > 0;


