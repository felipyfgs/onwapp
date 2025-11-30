-- Migration: 013_indexes.sql
-- Description: Performance indexes for all tables
-- Dependencies: All table migrations (001-011)

-- ============================================================================
-- zpSessions INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpSessions_status" ON "zpSessions"("status");
CREATE INDEX IF NOT EXISTS "idx_zpSessions_phone" ON "zpSessions"("phone") WHERE "phone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpSessions_deviceJid" ON "zpSessions"("deviceJid") WHERE "deviceJid" IS NOT NULL;

-- ============================================================================
-- zpMessages INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chat_timeline" ON "zpMessages"("sessionId", "chatJid", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_zpMessages_serverId" ON "zpMessages"("serverId") WHERE "serverId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_status" ON "zpMessages"("status");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_type" ON "zpMessages"("type");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_msgId" ON "zpMessages"("msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_unread" ON "zpMessages"("sessionId", "chatJid") WHERE "status" IN ('sent', 'delivered');
CREATE INDEX IF NOT EXISTS "idx_zpMessages_reactions" ON "zpMessages" USING GIN ("reactions") WHERE jsonb_array_length("reactions") > 0;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chat_direction" ON "zpMessages"("sessionId", "chatJid", "fromMe", "timestamp" DESC);

-- Chatwoot indexes
CREATE INDEX IF NOT EXISTS "idx_zpMessages_cwMsgId" ON "zpMessages"("sessionId", "cwMsgId") WHERE "cwMsgId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_cwSourceId" ON "zpMessages"("cwSourceId") WHERE "cwSourceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_cwConvId" ON "zpMessages"("sessionId", "cwConvId") WHERE "cwConvId" IS NOT NULL;

-- History Sync indexes
CREATE INDEX IF NOT EXISTS "idx_zpMessages_order" ON "zpMessages"("sessionId", "chatJid", "msgOrderID" DESC NULLS LAST) WHERE "msgOrderID" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_stubType" ON "zpMessages"("sessionId", "stubType") WHERE "stubType" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_expires" ON "zpMessages"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_zpMessages_status_broadcast" ON "zpMessages"("sessionId", "timestamp" DESC) WHERE "chatJid" = 'status@broadcast';

-- ============================================================================
-- zpWebhooks INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpWebhooks_enabled" ON "zpWebhooks"("enabled") WHERE "enabled" = TRUE;

-- ============================================================================
-- zpMessageUpdates INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_session_msg" ON "zpMessageUpdates"("sessionId", "msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_type" ON "zpMessageUpdates"("type");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_eventAt" ON "zpMessageUpdates"("eventAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_msgId" ON "zpMessageUpdates"("msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_reactions" ON "zpMessageUpdates"("sessionId", "msgId") WHERE "type" = 'reaction';
CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_delivery" ON "zpMessageUpdates"("sessionId", "msgId") WHERE "type" IN ('delivered', 'read', 'played');

-- ============================================================================
-- zpChatwoot INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpChatwoot_enabled" ON "zpChatwoot"("enabled") WHERE "enabled" = TRUE;

-- ============================================================================
-- zpMedia INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpMedia_pending_downloads" ON "zpMedia"("sessionId", "createdAt") 
    WHERE "downloaded" = FALSE AND "waDirectPath" IS NOT NULL AND "downloadAttempts" < 3;
CREATE INDEX IF NOT EXISTS "idx_zpMedia_mediaType" ON "zpMedia"("mediaType");
CREATE INDEX IF NOT EXISTS "idx_zpMedia_msgId" ON "zpMedia"("msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMedia_storage" ON "zpMedia"("sessionId", "storageKey") WHERE "storageKey" IS NOT NULL;

-- ============================================================================
-- zpChats INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpChats_session_timestamp" ON "zpChats"("sessionId", "conversationTimestamp" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_zpChats_unread" ON "zpChats"("sessionId", "unreadCount") WHERE "unreadCount" > 0;
CREATE INDEX IF NOT EXISTS "idx_zpChats_ephemeral" ON "zpChats"("sessionId") WHERE "ephemeralExpiration" > 0;

-- ============================================================================
-- zpGroupPastParticipants INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpGroupPastParticipants_group" ON "zpGroupPastParticipants"("sessionId", "groupJid", "leaveTimestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_zpGroupPastParticipants_user" ON "zpGroupPastParticipants"("sessionId", "userJid");
CREATE INDEX IF NOT EXISTS "idx_zpGroupPastParticipants_removed" ON "zpGroupPastParticipants"("sessionId", "groupJid") WHERE "leaveReason" = 1;

-- ============================================================================
-- zpStickers INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpStickers_usage" ON "zpStickers"("sessionId", "weight" DESC, "lastUsedAt" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_zpStickers_pending" ON "zpStickers"("sessionId", "syncedAt") 
    WHERE "downloaded" = FALSE AND "waDirectPath" IS NOT NULL AND "downloadAttempts" < 3;
CREATE INDEX IF NOT EXISTS "idx_zpStickers_type" ON "zpStickers"("sessionId", "isLottie");

-- ============================================================================
-- zpHistorySyncProgress INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_zpHistorySyncProgress_status" ON "zpHistorySyncProgress"("sessionId", "status");
