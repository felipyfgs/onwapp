-- Migration: 016_session_settings.sql
-- Description: Create settings table for unified session configuration

CREATE TABLE IF NOT EXISTS "onWappSettings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL UNIQUE REFERENCES "onWappSession"("id") ON DELETE CASCADE,
    
    -- Local Settings (managed by onwapp only)
    "alwaysOnline" BOOLEAN NOT NULL DEFAULT false,
    "autoRejectCalls" BOOLEAN NOT NULL DEFAULT false,
    "syncHistory" BOOLEAN NOT NULL DEFAULT false,
    
    -- Privacy Settings (synced FROM WhatsApp on connect, empty means not synced yet)
    "lastSeen" VARCHAR(20) NOT NULL DEFAULT '',
    "online" VARCHAR(20) NOT NULL DEFAULT '',
    "profilePhoto" VARCHAR(20) NOT NULL DEFAULT '',
    "status" VARCHAR(20) NOT NULL DEFAULT '',
    "readReceipts" VARCHAR(20) NOT NULL DEFAULT '',
    "groupAdd" VARCHAR(20) NOT NULL DEFAULT '',
    "callAdd" VARCHAR(20) NOT NULL DEFAULT '',
    
    -- Chat Settings (synced FROM WhatsApp on connect)
    "defaultDisappearingTimer" VARCHAR(10) NOT NULL DEFAULT '',
    
    -- Sync tracking
    "privacySyncedAt" TIMESTAMPTZ,
    
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onWappSettings" IS 'Session settings for WhatsApp configuration';
COMMENT ON COLUMN "onWappSettings"."sessionId" IS 'Reference to onWappSession';
COMMENT ON COLUMN "onWappSettings"."alwaysOnline" IS 'Keep session always showing online status (local only)';
COMMENT ON COLUMN "onWappSettings"."autoRejectCalls" IS 'Automatically reject incoming calls (local only)';
COMMENT ON COLUMN "onWappSettings"."syncHistory" IS 'Sync message history on connect (local only)';
COMMENT ON COLUMN "onWappSettings"."lastSeen" IS 'Who can see last seen (synced from WhatsApp): all, contacts, contact_blacklist, none';
COMMENT ON COLUMN "onWappSettings"."online" IS 'Who can see online status (synced from WhatsApp): all, match_last_seen';
COMMENT ON COLUMN "onWappSettings"."profilePhoto" IS 'Who can see profile photo (synced from WhatsApp): all, contacts, contact_blacklist, none';
COMMENT ON COLUMN "onWappSettings"."status" IS 'Who can see status/about (synced from WhatsApp): all, contacts, contact_blacklist, none';
COMMENT ON COLUMN "onWappSettings"."readReceipts" IS 'Send read receipts (synced from WhatsApp): all, none';
COMMENT ON COLUMN "onWappSettings"."groupAdd" IS 'Who can add to groups (synced from WhatsApp): all, contacts, contact_blacklist';
COMMENT ON COLUMN "onWappSettings"."callAdd" IS 'Who can call (synced from WhatsApp): all, known';
COMMENT ON COLUMN "onWappSettings"."defaultDisappearingTimer" IS 'Default disappearing timer (synced from WhatsApp): off, 24h, 7d, 90d';
COMMENT ON COLUMN "onWappSettings"."privacySyncedAt" IS 'When privacy settings were last synced from WhatsApp';

CREATE INDEX IF NOT EXISTS "idx_onWappSettings_sessionId" ON "onWappSettings"("sessionId");

-- Migrate existing sessions - create settings with local defaults only
-- Privacy settings will be synced from WhatsApp when session connects
INSERT INTO "onWappSettings" ("sessionId", "syncHistory")
SELECT "id", "syncHistory" FROM "onWappSession"
ON CONFLICT ("sessionId") DO NOTHING;
