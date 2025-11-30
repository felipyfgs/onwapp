-- Migration: 007_create_relationships.sql
-- Description: Foreign keys, cascade cleanup, and data integrity constraints
-- Dependencies: All _table migrations (001-006)

-- ============================================================================
-- WHATSMEOW CASCADE CLEANUP
-- ============================================================================
-- 
-- Problem: zpSessions.deviceJid links to whatsmeow_device.jid by value,
--          but there's no automatic cleanup when zpSession is deleted.
--
-- Solution: Trigger to delete whatsmeow_device when zpSessions is deleted.
--           This cascades to all whatsmeow child tables automatically.
-- ============================================================================

-- 1. Function to add missing FK to whatsmeow_privacy_tokens
-- Can be called anytime to ensure FK exists (idempotent)
CREATE OR REPLACE FUNCTION zp_ensure_whatsmeow_fks()
RETURNS void AS $$
BEGIN
    -- Add FK to whatsmeow_privacy_tokens if tables exist and FK doesn't
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsmeow_privacy_tokens') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsmeow_device')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints 
           WHERE constraint_name = 'whatsmeow_privacy_tokens_device_fk'
           AND table_name = 'whatsmeow_privacy_tokens'
       ) 
    THEN
        ALTER TABLE whatsmeow_privacy_tokens 
        ADD CONSTRAINT whatsmeow_privacy_tokens_device_fk 
        FOREIGN KEY (our_jid) REFERENCES whatsmeow_device(jid) ON DELETE CASCADE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Try to add FK now (will succeed if whatsmeow tables already exist)
SELECT zp_ensure_whatsmeow_fks();

-- 2. Trigger function to clean up whatsmeow_device when zpSessions is deleted
-- Note: whatsmeow_device table may not exist yet (created on first session connect)
CREATE OR REPLACE FUNCTION zp_cleanup_whatsmeow_device()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."deviceJid" IS NOT NULL AND OLD."deviceJid" != '' THEN
        -- Only delete if whatsmeow_device table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsmeow_device') THEN
            DELETE FROM whatsmeow_device WHERE jid = OLD."deviceJid";
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger on zpSessions table
DROP TRIGGER IF EXISTS trg_zpSessions_cleanup_whatsmeow ON "zpSessions";
CREATE TRIGGER trg_zpSessions_cleanup_whatsmeow
    BEFORE DELETE ON "zpSessions"
    FOR EACH ROW
    EXECUTE FUNCTION zp_cleanup_whatsmeow_device();

-- 4. Index on zpSessions.deviceJid for cascade operations
CREATE INDEX IF NOT EXISTS "idx_zpSessions_deviceJid" 
    ON "zpSessions"("deviceJid") 
    WHERE "deviceJid" IS NOT NULL;


-- ============================================================================
-- ZPWOOT TABLE RELATIONSHIPS
-- ============================================================================

-- 5. FK from zpMedia to zpMessages (DEFERRABLE for async history sync)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'zpMedia_message_fk'
        AND table_name = 'zpMedia'
    ) THEN
        -- Remove orphaned zpMedia records first
        DELETE FROM "zpMedia" m
        WHERE NOT EXISTS (
            SELECT 1 FROM "zpMessages" msg 
            WHERE msg."sessionId" = m."sessionId" AND msg."msgId" = m."msgId"
        );
        
        ALTER TABLE "zpMedia" 
        ADD CONSTRAINT "zpMedia_message_fk" 
        FOREIGN KEY ("sessionId", "msgId") 
        REFERENCES "zpMessages"("sessionId", "msgId") 
        ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;


-- ============================================================================
-- ADDITIONAL INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_zpMsgUpdates_msgId" ON "zpMessageUpdates"("msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_msgId" ON "zpMessages"("msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMedia_msgId" ON "zpMedia"("msgId");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chat_direction" 
    ON "zpMessages"("sessionId", "chatJid", "fromMe", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_zpMedia_storage" 
    ON "zpMedia"("sessionId", "storageKey") 
    WHERE "storageKey" IS NOT NULL;

-- View for media with message context (convenient access to denormalized data)
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


-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TRIGGER trg_zpSessions_cleanup_whatsmeow ON "zpSessions" IS 
    'Deletes whatsmeow_device when zpSession is deleted, cascading to all whatsmeow tables';

COMMENT ON CONSTRAINT "zpMedia_message_fk" ON "zpMedia" IS 
    'Links media to parent message. DEFERRABLE for async history sync.';
