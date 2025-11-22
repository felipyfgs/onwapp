-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('disconnected', 'connecting', 'connected');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionId_key" ON "Session"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthState_sessionId_keyType_keyId_key" ON "AuthState"("sessionId", "keyType", "keyId");

-- AddForeignKey
ALTER TABLE "AuthState" ADD CONSTRAINT "AuthState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;
