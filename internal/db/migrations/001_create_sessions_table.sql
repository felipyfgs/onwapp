CREATE TABLE IF NOT EXISTS "zpSessions" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "deviceJid" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'disconnected',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_zpSessions_name" ON "zpSessions"("name");
CREATE INDEX IF NOT EXISTS "idx_zpSessions_status" ON "zpSessions"("status");
