-- Add Chatwoot integration fields to messages table
ALTER TABLE "zpMessages" 
ADD COLUMN IF NOT EXISTS "chatwootMessageId" INTEGER,
ADD COLUMN IF NOT EXISTS "chatwootConversationId" INTEGER,
ADD COLUMN IF NOT EXISTS "chatwootSourceId" TEXT;

-- Index for finding messages by Chatwoot message ID
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chatwootMessageId" ON "zpMessages"("chatwootMessageId") WHERE "chatwootMessageId" IS NOT NULL;

-- Index for finding messages by Chatwoot source ID
CREATE INDEX IF NOT EXISTS "idx_zpMessages_chatwootSourceId" ON "zpMessages"("chatwootSourceId") WHERE "chatwootSourceId" IS NOT NULL;
