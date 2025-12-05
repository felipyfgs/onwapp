-- Migration: 008_chats.sql
-- Table: onZapChat
-- Description: Extended chat metadata from History Sync
-- Dependencies: onZapSession (002)
-- Note: Complements whatsmeow_chat_settings (muted, pinned, archived)

CREATE TABLE IF NOT EXISTS "onZapChat" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "onZapSession"("id") ON DELETE CASCADE,
    "chatJid" VARCHAR(255) NOT NULL,
    
    -- Display Info
    "name" VARCHAR(500),
    
    -- Unread Tracking
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "unreadMentionCount" INTEGER NOT NULL DEFAULT 0,
    "markedAsUnread" BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Ephemeral/Disappearing Settings
    "ephemeralExpiration" INTEGER DEFAULT 0,
    "ephemeralSettingTimestamp" BIGINT DEFAULT 0,
    "disappearingInitiator" SMALLINT DEFAULT 0,
    
    -- Chat State
    "readOnly" BOOLEAN NOT NULL DEFAULT FALSE,
    "suspended" BOOLEAN NOT NULL DEFAULT FALSE,
    "locked" BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Limit Sharing (Privacy Feature)
    "limitSharing" BOOLEAN NOT NULL DEFAULT FALSE,
    "limitSharingTimestamp" BIGINT DEFAULT 0,
    "limitSharingTrigger" SMALLINT DEFAULT 0,
    "limitSharingInitiatedByMe" BOOLEAN DEFAULT FALSE,
    
    -- Group-Specific
    "isDefaultSubgroup" BOOLEAN NOT NULL DEFAULT FALSE,
    "commentsCount" INTEGER DEFAULT 0,
    
    -- Sync Metadata
    "conversationTimestamp" BIGINT,
    "pHash" VARCHAR(100),
    "notSpam" BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    "syncedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "onZapChat_session_chat_unique" UNIQUE ("sessionId", "chatJid")
);

COMMENT ON TABLE "onZapChat" IS 'Extended chat metadata from History Sync';
COMMENT ON COLUMN "onZapChat"."ephemeralExpiration" IS 'Disappearing message timer in seconds (0=off)';
COMMENT ON COLUMN "onZapChat"."disappearingInitiator" IS '0=unknown, 1=me, 2=them';
COMMENT ON COLUMN "onZapChat"."limitSharing" IS 'Privacy: Only contacts can see profile/status';
COMMENT ON COLUMN "onZapChat"."pHash" IS 'Participant hash - changes when group membership changes';
