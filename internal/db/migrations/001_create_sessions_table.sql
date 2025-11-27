CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "zpSessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "deviceJid" VARCHAR(255),
    "phone" VARCHAR(50),
    "status" VARCHAR(50) DEFAULT 'disconnected',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_zpSessions_name" ON "zpSessions"("name");
CREATE INDEX IF NOT EXISTS "idx_zpSessions_status" ON "zpSessions"("status");
CREATE INDEX IF NOT EXISTS "idx_zpSessions_phone" ON "zpSessions"("phone");
