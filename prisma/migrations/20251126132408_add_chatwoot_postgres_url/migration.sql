-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('ringing', 'accepted', 'rejected', 'missed', 'timeout');

-- AlterTable
ALTER TABLE "Chatwoot" ADD COLUMN     "chatwootPostgresUrl" TEXT;

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "groupJid" TEXT NOT NULL,
    "subject" TEXT,
    "owner" TEXT,
    "description" TEXT,
    "participants" JSONB,
    "creation" BIGINT,
    "restrict" BOOLEAN NOT NULL DEFAULT false,
    "announce" BOOLEAN NOT NULL DEFAULT false,
    "size" INTEGER,
    "ephemeral" INTEGER,
    "inviteCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "senderJid" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "fromJid" TEXT NOT NULL,
    "toJid" TEXT,
    "status" "CallStatus" NOT NULL DEFAULT 'ringing',
    "isVideo" BOOLEAN NOT NULL DEFAULT false,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Group_sessionId_idx" ON "Group"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_sessionId_groupJid_key" ON "Group"("sessionId", "groupJid");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_senderJid_key" ON "MessageReaction"("messageId", "senderJid");

-- CreateIndex
CREATE INDEX "Call_sessionId_idx" ON "Call"("sessionId");

-- CreateIndex
CREATE INDEX "Call_timestamp_idx" ON "Call"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Call_sessionId_callId_key" ON "Call"("sessionId", "callId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
