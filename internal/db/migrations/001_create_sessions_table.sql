CREATE TABLE IF NOT EXISTS "sessions" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "deviceJid" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'disconnected',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_sessions_name" ON "sessions"("name");
CREATE INDEX IF NOT EXISTS "idx_sessions_status" ON "sessions"("status");
