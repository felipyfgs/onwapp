/*
  Warnings:

  - You are about to drop the `auth_states` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proxy_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `webhook_configs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "auth_states" DROP CONSTRAINT "auth_states_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "proxy_configs" DROP CONSTRAINT "proxy_configs_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "webhook_configs" DROP CONSTRAINT "webhook_configs_sessionId_fkey";

-- DropTable
DROP TABLE "auth_states";

-- DropTable
DROP TABLE "proxy_configs";

-- DropTable
DROP TABLE "webhook_configs";

-- CreateTable
CREATE TABLE "authStates" (
    "id" TEXT NOT NULL,
    "creds" JSONB NOT NULL DEFAULT '{}',
    "keys" JSONB NOT NULL DEFAULT '{}',
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authStates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhookConfigs" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhookConfigs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxyConfigs" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "protocol" TEXT NOT NULL DEFAULT 'http',
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proxyConfigs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authStates_sessionId_key" ON "authStates"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "proxyConfigs_sessionId_key" ON "proxyConfigs"("sessionId");

-- AddForeignKey
ALTER TABLE "authStates" ADD CONSTRAINT "authStates_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhookConfigs" ADD CONSTRAINT "webhookConfigs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proxyConfigs" ADD CONSTRAINT "proxyConfigs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
