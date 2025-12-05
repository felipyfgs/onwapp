-- Migration: 004_webhooks.sql
-- Table: onZapWebhook
-- Description: Webhook configurations for event notifications
-- Dependencies: onZapSession (002)

CREATE TABLE IF NOT EXISTS "onZapWebhook" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL UNIQUE REFERENCES "onZapSession"("id") ON DELETE CASCADE,
    "url" VARCHAR(500) NOT NULL,
    "events" TEXT[] NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "secret" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onZapWebhook" IS 'Webhook configurations for event notifications';
COMMENT ON COLUMN "onZapWebhook"."events" IS 'Array of event types to subscribe (empty = all)';
COMMENT ON COLUMN "onZapWebhook"."secret" IS 'HMAC secret for webhook signature verification';
