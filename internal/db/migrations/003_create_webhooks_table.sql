CREATE TABLE IF NOT EXISTS "zpWebhooks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL UNIQUE REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "url" VARCHAR(500) NOT NULL,
    "events" TEXT[] DEFAULT '{}',
    "enabled" BOOLEAN DEFAULT true,
    "secret" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_zpWebhooks_enabled" ON "zpWebhooks"("enabled");
