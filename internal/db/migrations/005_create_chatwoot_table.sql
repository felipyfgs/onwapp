CREATE TABLE IF NOT EXISTS "zpChatwoot" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL UNIQUE REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT NOT NULL DEFAULT '',
    "token" TEXT NOT NULL DEFAULT '',
    "account" INTEGER NOT NULL DEFAULT 0,
    "inboxId" INTEGER,
    "inbox" TEXT,
    "signAgent" BOOLEAN NOT NULL DEFAULT false,
    "signSeparator" TEXT,
    "autoReopen" BOOLEAN NOT NULL DEFAULT false,
    "startPending" BOOLEAN NOT NULL DEFAULT false,
    "mergeBrPhones" BOOLEAN NOT NULL DEFAULT false,
    "syncContacts" BOOLEAN NOT NULL DEFAULT false,
    "syncMessages" BOOLEAN NOT NULL DEFAULT false,
    "syncDays" INTEGER DEFAULT 0,
    "ignoreChats" TEXT[],
    "autoCreate" BOOLEAN NOT NULL DEFAULT false,
    "webhookUrl" TEXT,
    "chatwootDbHost" TEXT,
    "chatwootDbPort" INTEGER DEFAULT 5432,
    "chatwootDbUser" TEXT,
    "chatwootDbPass" TEXT,
    "chatwootDbName" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_zpChatwoot_sessionId" ON "zpChatwoot"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_zpChatwoot_enabled" ON "zpChatwoot"("enabled");
