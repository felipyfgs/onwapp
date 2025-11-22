/*
  Warnings:

  - You are about to drop the column `sessionId` on the `Session` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuthState" DROP CONSTRAINT "AuthState_sessionId_fkey";

-- DropIndex
DROP INDEX "Session_sessionId_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "sessionId";

-- AddForeignKey
ALTER TABLE "AuthState" ADD CONSTRAINT "AuthState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
