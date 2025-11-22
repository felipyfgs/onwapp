/*
  Warnings:

  - You are about to drop the column `creds` on the `authStates` table. All the data in the column will be lost.
  - You are about to drop the column `keys` on the `authStates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "authStates" DROP COLUMN "creds",
DROP COLUMN "keys",
ADD COLUMN     "data" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "keyId" TEXT;
