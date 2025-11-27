-- Add UNIQUE constraint on sessionId for one webhook per session
-- First delete any duplicate webhooks keeping only the most recent one
DELETE FROM "zpWebhooks" a USING "zpWebhooks" b
WHERE a."id" < b."id" AND a."sessionId" = b."sessionId";

-- Add unique constraint
ALTER TABLE "zpWebhooks" ADD CONSTRAINT "zpWebhooks_sessionId_unique" UNIQUE ("sessionId");
