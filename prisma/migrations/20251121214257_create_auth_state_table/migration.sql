-- CreateTable
CREATE TABLE "auth_states" (
    "id" TEXT NOT NULL,
    "creds" JSONB NOT NULL DEFAULT '{}',
    "keys" JSONB NOT NULL DEFAULT '{}',
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_states_sessionId_key" ON "auth_states"("sessionId");

-- Migrate existing creds data to auth_states table
INSERT INTO "auth_states" ("id", "sessionId", "creds", "keys", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    "id",
    COALESCE("creds", '{}'::jsonb),
    '{}'::jsonb,
    "createdAt",
    "updatedAt"
FROM "sessions"
WHERE "creds" IS NOT NULL;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "creds";

-- AddForeignKey
ALTER TABLE "auth_states" ADD CONSTRAINT "auth_states_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;