-- Migration: 006_chatwoot.sql
-- Table: onZapChatwoot
-- Description: Chatwoot CRM integration configuration per session
-- Dependencies: onZapSession (002)

CREATE TABLE IF NOT EXISTS "onZapChatwoot" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL UNIQUE REFERENCES "onZapSession"("id") ON DELETE CASCADE,
    "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "url" TEXT NOT NULL DEFAULT '',
    "token" TEXT NOT NULL DEFAULT '',
    "account" INTEGER NOT NULL DEFAULT 0,
    "inboxId" INTEGER,
    "inbox" TEXT,
    "signAgent" BOOLEAN NOT NULL DEFAULT FALSE,
    "signSeparator" TEXT,
    "autoReopen" BOOLEAN NOT NULL DEFAULT FALSE,
    "startPending" BOOLEAN NOT NULL DEFAULT FALSE,
    "mergeBrPhones" BOOLEAN NOT NULL DEFAULT FALSE,
    "syncContacts" BOOLEAN NOT NULL DEFAULT FALSE,
    "syncMessages" BOOLEAN NOT NULL DEFAULT FALSE,
    "syncDays" INTEGER DEFAULT 0,
    "ignoreChats" TEXT[],
    "autoCreate" BOOLEAN NOT NULL DEFAULT FALSE,
    "webhookUrl" TEXT,
    "chatwootDbHost" TEXT,
    "chatwootDbPort" INTEGER DEFAULT 5432,
    "chatwootDbUser" TEXT,
    "chatwootDbPass" TEXT,
    "chatwootDbName" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onZapChatwoot" IS 'Chatwoot CRM integration configuration per session';
COMMENT ON COLUMN "onZapChatwoot"."mergeBrPhones" IS 'Normalize Brazilian phone numbers (9th digit)';
COMMENT ON COLUMN "onZapChatwoot"."syncDays" IS 'Number of days to sync history (0 = disabled)';
