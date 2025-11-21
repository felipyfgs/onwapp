/*
  Warnings:

  - The `status` column on the `sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('disconnected', 'connecting', 'connected');

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'disconnected';
