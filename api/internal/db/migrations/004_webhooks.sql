-- Migration: 004_webhooks.sql
-- Table: onWappWebhook
-- Description: Webhook configurations for event notifications
-- Dependencies: onWappSession (002)

CREATE TABLE IF NOT EXISTS "onWappWebhook" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL UNIQUE REFERENCES "onWappSession"("id") ON DELETE CASCADE,
    "url" VARCHAR(500) NOT NULL,
    "events" TEXT[] NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "secret" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onWappWebhook" IS 'Webhook configurations for event notifications';
COMMENT ON COLUMN "onWappWebhook"."events" IS 'Array of event types to subscribe (empty = all)';
COMMENT ON COLUMN "onWappWebhook"."secret" IS 'HMAC secret for webhook signature verification';
