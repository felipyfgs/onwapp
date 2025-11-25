-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('disconnected', 'connecting', 'connected');

-- CreateEnum
CREATE TYPE "WAPrivacyValue" AS ENUM ('all', 'contacts', 'contact_blacklist', 'none');

-- CreateEnum
CREATE TYPE "WAPrivacyOnlineValue" AS ENUM ('all', 'match_last_seen');

-- CreateEnum
CREATE TYPE "WAPrivacyCallValue" AS ENUM ('all', 'known');

-- CreateEnum
CREATE TYPE "WAPrivacyMessagesValue" AS ENUM ('all', 'contacts');

-- CreateEnum
CREATE TYPE "WAReadReceiptsValue" AS ENUM ('all', 'none');

-- CreateEnum
CREATE TYPE "WAPrivacyGroupAddValue" AS ENUM ('all', 'contacts', 'contact_blacklist');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'disconnected',
    "qrCode" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthState" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "keyType" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "keyData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "name" TEXT,
    "profilePicUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "name" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageTimestamp" BIGINT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fromMe" BOOLEAN NOT NULL,
    "senderJid" TEXT,
    "senderName" TEXT,
    "timestamp" BIGINT NOT NULL,
    "messageType" TEXT NOT NULL,
    "textContent" TEXT,
    "mediaUrl" TEXT,
    "fileLength" BIGINT,
    "content" JSONB NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'pending',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageStatusHistory" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "recipientJid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSettings" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rejectCall" BOOLEAN NOT NULL DEFAULT false,
    "groupsIgnore" BOOLEAN NOT NULL DEFAULT false,
    "alwaysOnline" BOOLEAN NOT NULL DEFAULT false,
    "readMessages" BOOLEAN NOT NULL DEFAULT false,
    "readStatus" BOOLEAN NOT NULL DEFAULT false,
    "syncFullHistory" BOOLEAN NOT NULL DEFAULT true,
    "profilePicture" "WAPrivacyValue",
    "status" "WAPrivacyValue",
    "lastSeen" "WAPrivacyValue",
    "online" "WAPrivacyOnlineValue",
    "call" "WAPrivacyCallValue",
    "messages" "WAPrivacyMessagesValue",
    "readReceipts" "WAReadReceiptsValue",
    "groupsAdd" "WAPrivacyGroupAddValue",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthState_sessionId_keyType_keyId_key" ON "AuthState"("sessionId", "keyType", "keyId");

-- CreateIndex
CREATE UNIQUE INDEX "Webhook_sessionId_key" ON "Webhook"("sessionId");

-- CreateIndex
CREATE INDEX "Contact_sessionId_name_idx" ON "Contact"("sessionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_sessionId_remoteJid_key" ON "Contact"("sessionId", "remoteJid");

-- CreateIndex
CREATE INDEX "Chat_sessionId_lastMessageTimestamp_idx" ON "Chat"("sessionId", "lastMessageTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_sessionId_remoteJid_key" ON "Chat"("sessionId", "remoteJid");

-- CreateIndex
CREATE INDEX "Message_sessionId_chatId_timestamp_idx" ON "Message"("sessionId", "chatId", "timestamp");

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- CreateIndex
CREATE INDEX "Message_textContent_idx" ON "Message"("textContent");

-- CreateIndex
CREATE INDEX "Message_mediaUrl_idx" ON "Message"("mediaUrl");

-- CreateIndex
CREATE INDEX "Message_messageType_idx" ON "Message"("messageType");

-- CreateIndex
CREATE INDEX "Message_timestamp_idx" ON "Message"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Message_sessionId_messageId_key" ON "Message"("sessionId", "messageId");

-- CreateIndex
CREATE INDEX "MessageStatusHistory_messageId_idx" ON "MessageStatusHistory"("messageId");

-- CreateIndex
CREATE INDEX "MessageStatusHistory_timestamp_idx" ON "MessageStatusHistory"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "SessionSettings_sessionId_key" ON "SessionSettings"("sessionId");

-- AddForeignKey
ALTER TABLE "AuthState" ADD CONSTRAINT "AuthState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageStatusHistory" ADD CONSTRAINT "MessageStatusHistory_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSettings" ADD CONSTRAINT "SessionSettings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
