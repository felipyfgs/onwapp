-- CreateTable
CREATE TABLE "Chatwoot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT,
    "token" TEXT,
    "url" TEXT,
    "nameInbox" TEXT,
    "signMsg" BOOLEAN NOT NULL DEFAULT false,
    "signDelimiter" TEXT DEFAULT '\n',
    "reopenConversation" BOOLEAN NOT NULL DEFAULT false,
    "conversationPending" BOOLEAN NOT NULL DEFAULT false,
    "mergeBrazilContacts" BOOLEAN NOT NULL DEFAULT false,
    "importContacts" BOOLEAN NOT NULL DEFAULT false,
    "importMessages" BOOLEAN NOT NULL DEFAULT false,
    "daysLimitImportMessages" INTEGER DEFAULT 3,
    "organization" TEXT,
    "logo" TEXT,
    "ignoreJids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chatwoot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chatwoot_sessionId_key" ON "Chatwoot"("sessionId");

-- AddForeignKey
ALTER TABLE "Chatwoot" ADD CONSTRAINT "Chatwoot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
