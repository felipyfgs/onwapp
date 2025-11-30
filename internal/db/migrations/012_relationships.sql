-- Migration: 012_relationships.sql
-- Description: Foreign keys, triggers, and cascade cleanup
-- Dependencies: All table migrations (001-011)

-- ============================================================================
-- WHATSMEOW CASCADE CLEANUP
-- ============================================================================

-- Function to add missing FK to whatsmeow_privacy_tokens
CREATE OR REPLACE FUNCTION zp_ensure_whatsmeow_fks()
RETURNS void AS $$
BEGIN
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

SELECT zp_ensure_whatsmeow_fks();

-- Trigger function to clean up whatsmeow_device when zpSessions is deleted
CREATE OR REPLACE FUNCTION zp_cleanup_whatsmeow_device()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."deviceJid" IS NOT NULL AND OLD."deviceJid" != '' THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsmeow_device') THEN
            DELETE FROM whatsmeow_device WHERE jid = OLD."deviceJid";
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_zpSessions_cleanup_whatsmeow ON "zpSessions";
CREATE TRIGGER trg_zpSessions_cleanup_whatsmeow
    BEFORE DELETE ON "zpSessions"
    FOR EACH ROW
    EXECUTE FUNCTION zp_cleanup_whatsmeow_device();

-- ============================================================================
-- ZPWOOT TABLE RELATIONSHIPS
-- ============================================================================

-- FK from zpMedia to zpMessages (DEFERRABLE for async history sync)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'zpMedia_message_fk'
        AND table_name = 'zpMedia'
    ) THEN
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

COMMENT ON TRIGGER trg_zpSessions_cleanup_whatsmeow ON "zpSessions" IS 
    'Deletes whatsmeow_device when zpSession is deleted, cascading to all whatsmeow tables';
COMMENT ON CONSTRAINT "zpMedia_message_fk" ON "zpMedia" IS 
    'Links media to parent message. DEFERRABLE for async history sync.';
