-- Migration: 018_tickets.sql
-- Description: Ticket system tables (Whaticket-style)
-- Dependencies: onWappSession (002)

-- 1. Users/Agents Table
CREATE TABLE IF NOT EXISTS "onWappUser" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "profile" VARCHAR(20) NOT NULL DEFAULT 'user',
    "online" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onWappUser" IS 'System users/agents for ticket management';
COMMENT ON COLUMN "onWappUser"."profile" IS 'User role: admin or user';

-- 2. Queues/Departments Table
CREATE TABLE IF NOT EXISTS "onWappQueue" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "greetingMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onWappQueue" IS 'Ticket queues/departments for routing';
COMMENT ON COLUMN "onWappQueue"."color" IS 'Queue color in #RRGGBB format';

-- 3. Tickets Table
CREATE TABLE IF NOT EXISTS "onWappTicket" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "onWappSession"("id") ON DELETE CASCADE,
    "contactJid" VARCHAR(255) NOT NULL,
    "contactName" VARCHAR(255),
    "contactPicUrl" VARCHAR(500),
    "queueId" UUID REFERENCES "onWappQueue"("id") ON DELETE SET NULL,
    "userId" UUID REFERENCES "onWappUser"("id") ON DELETE SET NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "lastMessage" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "isGroup" BOOLEAN NOT NULL DEFAULT FALSE,
    "closedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "onWappTicket_session_contact_unique" UNIQUE ("sessionId", "contactJid")
);

COMMENT ON TABLE "onWappTicket" IS 'Support tickets linked to WhatsApp conversations';
COMMENT ON COLUMN "onWappTicket"."status" IS 'Ticket status: pending, open, closed';
COMMENT ON COLUMN "onWappTicket"."closedAt" IS 'Timestamp when ticket was closed (for 2-hour reopen rule)';

-- 4. User-Queue Association (Many-to-Many)
CREATE TABLE IF NOT EXISTS "onWappUserQueue" (
    "userId" UUID NOT NULL REFERENCES "onWappUser"("id") ON DELETE CASCADE,
    "queueId" UUID NOT NULL REFERENCES "onWappQueue"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "queueId")
);

COMMENT ON TABLE "onWappUserQueue" IS 'Associates users/agents with queues they can handle';

-- 5. Session-Queue Association (Many-to-Many)
CREATE TABLE IF NOT EXISTS "onWappSessionQueue" (
    "sessionId" UUID NOT NULL REFERENCES "onWappSession"("id") ON DELETE CASCADE,
    "queueId" UUID NOT NULL REFERENCES "onWappQueue"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("sessionId", "queueId")
);

COMMENT ON TABLE "onWappSessionQueue" IS 'Associates WhatsApp sessions with available queues';

-- 6. Quick Replies Table
CREATE TABLE IF NOT EXISTS "onWappQuickReply" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "shortcut" VARCHAR(50) UNIQUE NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onWappQuickReply" IS 'Quick reply templates with shortcuts';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_onWappTicket_session" ON "onWappTicket" ("sessionId");
CREATE INDEX IF NOT EXISTS "idx_onWappTicket_status" ON "onWappTicket" ("status");
CREATE INDEX IF NOT EXISTS "idx_onWappTicket_queue" ON "onWappTicket" ("queueId");
CREATE INDEX IF NOT EXISTS "idx_onWappTicket_user" ON "onWappTicket" ("userId");
CREATE INDEX IF NOT EXISTS "idx_onWappTicket_updated" ON "onWappTicket" ("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_onWappUser_email" ON "onWappUser" ("email");
CREATE INDEX IF NOT EXISTS "idx_onWappQuickReply_shortcut" ON "onWappQuickReply" ("shortcut");

-- 7. Auto-migrate existing chats to tickets as pending (no queue)
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
