-- Migration: 011_history_sync_progress.sql
-- Table: zpHistorySyncProgress
-- Description: Tracks History Sync progress per session
-- Dependencies: zpSessions (002)

CREATE TABLE IF NOT EXISTS "zpHistorySyncProgress" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    
    -- Sync Type
    "syncType" VARCHAR(50) NOT NULL,
    
    -- Progress Markers
    "lastChunkIndex" INTEGER DEFAULT 0,
    "lastMsgOrderID" BIGINT,
    "lastTimestamp" TIMESTAMPTZ,
    
    -- Status
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "progress" SMALLINT DEFAULT 0,
    
    -- Statistics
    "totalChunks" INTEGER,
    "processedChunks" INTEGER DEFAULT 0,
    "totalMessages" INTEGER DEFAULT 0,
    "processedMessages" INTEGER DEFAULT 0,
    "totalChats" INTEGER DEFAULT 0,
    "processedChats" INTEGER DEFAULT 0,
    "errors" INTEGER DEFAULT 0,
    
    -- Timing
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "zpHistorySyncProgress_session_type_unique" UNIQUE ("sessionId", "syncType")
);

COMMENT ON TABLE "zpHistorySyncProgress" IS 'Tracks History Sync progress for resumable syncs';
COMMENT ON COLUMN "zpHistorySyncProgress"."syncType" IS 'INITIAL_BOOTSTRAP, INITIAL_STATUS_V3, RECENT, PUSH_NAME, NON_BLOCKING_DATA, ON_DEMAND, FULL';
COMMENT ON COLUMN "zpHistorySyncProgress"."status" IS 'pending, in_progress, completed, failed';
