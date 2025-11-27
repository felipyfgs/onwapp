CREATE TABLE IF NOT EXISTS "zpMessages" (
    "id" SERIAL PRIMARY KEY,
    "sessionId" INTEGER NOT NULL REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "messageId" VARCHAR(255) NOT NULL,
    "chatJid" VARCHAR(255) NOT NULL,
    "senderJid" VARCHAR(255),
    "type" VARCHAR(50) NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "mediaMimetype" VARCHAR(100),
    "mediaSize" INTEGER,
    "timestamp" TIMESTAMP WITH TIME ZONE,
    "direction" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'sent',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_zpMessages_sessionId" ON "zpMessages"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chatJid" ON "zpMessages"("chatJid");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_messageId" ON "zpMessages"("messageId");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_timestamp" ON "zpMessages"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_zpMessages_direction" ON "zpMessages"("direction");
