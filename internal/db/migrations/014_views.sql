-- Migration: 014_views.sql
-- Description: Database views for common queries
-- Dependencies: All table migrations (001-011)

-- ============================================================================
-- vwMediaWithContext - Media with message context
-- ============================================================================
CREATE OR REPLACE VIEW "vwMediaWithContext" AS
SELECT 
    m.*,
    msg."chatJid",
    msg."fromMe",
    msg."content" AS "caption",
    msg."pushName",
    msg."timestamp" AS "messageTimestamp"
FROM "zpMedia" m
JOIN "zpMessages" msg ON msg."sessionId" = m."sessionId" AND msg."msgId" = m."msgId";

COMMENT ON VIEW "vwMediaWithContext" IS 'Media files with message context (chatJid, fromMe, caption)';

-- ============================================================================
-- vwChatList - Chat list from zpChats
-- ============================================================================
CREATE OR REPLACE VIEW "vwChatList" AS
SELECT 
    c."id",
    c."sessionId",
    c."chatJid",
    c."name",
    c."unreadCount",
    c."unreadMentionCount",
    c."markedAsUnread",
    c."ephemeralExpiration",
    c."disappearingInitiator",
    c."readOnly",
    c."suspended",
    c."locked",
    c."limitSharing",
    c."conversationTimestamp",
    to_timestamp(c."conversationTimestamp") AS "lastMessageAt",
    c."syncedAt",
    c."updatedAt",
    -- Placeholders for whatsmeow data (filled by app if available)
    FALSE AS "archived",
    FALSE AS "pinned",
    ''::text AS "muted"
FROM "zpChats" c;

COMMENT ON VIEW "vwChatList" IS 'Chat list view. Archived/pinned/muted populated by app from whatsmeow if available.';

-- ============================================================================
-- vwGroupHistory - Group membership history
-- ============================================================================
CREATE OR REPLACE VIEW "vwGroupHistory" AS
SELECT 
    pp."id",
    pp."sessionId",
    pp."groupJid",
    pp."userJid",
    CASE WHEN pp."userJid" LIKE '%@s.whatsapp.net' 
         THEN split_part(pp."userJid", '@', 1) 
    END AS "phone",
    ''::text AS "pushName",
    pp."leaveReason",
    CASE pp."leaveReason" 
        WHEN 0 THEN 'left'
        WHEN 1 THEN 'removed'
        ELSE 'unknown'
    END AS "leaveReasonText",
    pp."leaveTimestamp",
    pp."syncedAt"
FROM "zpGroupPastParticipants" pp;

COMMENT ON VIEW "vwGroupHistory" IS 'Group membership history. PushName populated by app from whatsmeow_contacts if available.';
