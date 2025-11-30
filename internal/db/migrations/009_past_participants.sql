-- Migration: 009_past_participants.sql
-- Table: zpGroupPastParticipants
-- Description: Historical record of users who left/were removed from groups
-- Dependencies: zpSessions (002)

CREATE TABLE IF NOT EXISTS "zpGroupPastParticipants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "groupJid" VARCHAR(255) NOT NULL,
    "userJid" VARCHAR(255) NOT NULL,
    
    -- Leave Details
    "leaveReason" SMALLINT NOT NULL DEFAULT 0,
    "leaveTimestamp" TIMESTAMPTZ NOT NULL,
    
    -- Resolved Info
    "phone" VARCHAR(50),
    "pushName" VARCHAR(255),
    
    -- Metadata
    "syncedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "zpGroupPastParticipants_unique" UNIQUE ("sessionId", "groupJid", "userJid", "leaveTimestamp")
);

COMMENT ON TABLE "zpGroupPastParticipants" IS 'Historical record of users who left or were removed from groups';
COMMENT ON COLUMN "zpGroupPastParticipants"."leaveReason" IS '0=left voluntarily, 1=removed by admin';
