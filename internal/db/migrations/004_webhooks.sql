-- Migration: 004_webhooks.sql
-- Table: zpWebhooks
-- Description: Webhook configurations for event notifications
-- Dependencies: zpSessions (002)

CREATE TABLE IF NOT EXISTS "zpWebhooks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL UNIQUE REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "url" VARCHAR(500) NOT NULL,
    "events" TEXT[] NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "secret" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "zpWebhooks" IS 'Webhook configurations for event notifications';
COMMENT ON COLUMN "zpWebhooks"."events" IS 'Array of event types to subscribe (empty = all)';
COMMENT ON COLUMN "zpWebhooks"."secret" IS 'HMAC secret for webhook signature verification';
