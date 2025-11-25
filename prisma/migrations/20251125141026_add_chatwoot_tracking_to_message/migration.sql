-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "chatwootContactId" INTEGER,
ADD COLUMN     "chatwootConversationId" INTEGER,
ADD COLUMN     "chatwootInboxId" INTEGER,
ADD COLUMN     "chatwootMessageId" INTEGER;

-- CreateIndex
CREATE INDEX "Message_chatwootConversationId_idx" ON "Message"("chatwootConversationId");

-- CreateIndex
CREATE INDEX "Message_chatwootMessageId_idx" ON "Message"("chatwootMessageId");
