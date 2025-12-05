-- Migration: 015_functions.sql
-- Description: Helper functions
-- Dependencies: zpChats (008)

-- ============================================================================
-- zp_get_chat_context - Get context for a specific chat
-- ============================================================================
CREATE OR REPLACE FUNCTION zp_get_chat_context(
    p_session_id UUID,
    p_chat_jid VARCHAR
)
RETURNS TABLE (
    chat_jid VARCHAR,
    chat_name VARCHAR,
    unread_count INTEGER,
    last_message_at TIMESTAMPTZ,
    ephemeral_seconds INTEGER,
    is_read_only BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c."chatJid"::VARCHAR,
        c."name"::VARCHAR,
        c."unreadCount",
        to_timestamp(c."conversationTimestamp"),
        c."ephemeralExpiration",
        c."readOnly"
    FROM "onZapChat" c
    WHERE c."sessionId" = p_session_id AND c."chatJid" = p_chat_jid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION zp_get_chat_context IS 'Get chat context by session and JID';
