-- Migration: 019_sync_chats_tickets.sql
-- Description: Sync existing chats to tickets (runs on startup)
-- Dependencies: 018_tickets, onWappChat

-- Auto-migrate existing chats to tickets as pending (no queue assigned)
INSERT INTO "onWappTicket" ("sessionId", "contactJid", "contactName", "unreadCount", "isGroup", "status", "createdAt", "updatedAt")
SELECT 
    c."sessionId",
    c."chatJid",
    c."name",
    c."unreadCount",
    c."chatJid" LIKE '%@g.us',
    'pending',
    COALESCE(to_timestamp(c."conversationTimestamp"), c."syncedAt"),
    c."updatedAt"
FROM "onWappChat" c
WHERE NOT c.archived
  AND c."chatJid" NOT LIKE '%@broadcast'
  AND c."chatJid" NOT LIKE '%@newsletter'
  AND c."chatJid" NOT LIKE '%@lid'
ON CONFLICT ("sessionId", "contactJid") DO NOTHING;
