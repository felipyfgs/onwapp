-- Migration: 002_sessions.sql
-- Table: onZapSession
-- Description: WhatsApp sessions with device credentials and connection state

CREATE TABLE IF NOT EXISTS "onZapSession" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session" VARCHAR(255) UNIQUE NOT NULL,
    "deviceJid" VARCHAR(255),
    "phone" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    
    -- Perfil WhatsApp
    "pushName" VARCHAR(255),
    "profilePictureUrl" TEXT,
    "about" VARCHAR(500),
    
    -- Informações do Dispositivo
    "platform" VARCHAR(50),
    "businessName" VARCHAR(255),
    
    -- Monitoramento de Conexão
    "lastConnectedAt" TIMESTAMPTZ,
    "lastDisconnectedAt" TIMESTAMPTZ,
    "lastActivityAt" TIMESTAMPTZ,
    "disconnectReason" VARCHAR(255),
    
    -- Configuração
    "syncHistory" BOOLEAN NOT NULL DEFAULT false,
    "historySyncStatus" VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- Autenticação
    "apiKey" VARCHAR(64),
    
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "onZapSession" IS 'WhatsApp sessions with device credentials and connection state';
COMMENT ON COLUMN "onZapSession"."session" IS 'Unique session identifier (used in API routes)';
COMMENT ON COLUMN "onZapSession"."deviceJid" IS 'WhatsApp device JID after connection';
COMMENT ON COLUMN "onZapSession"."status" IS 'Connection status: disconnected, connecting, connected';
COMMENT ON COLUMN "onZapSession"."pushName" IS 'WhatsApp display name';
COMMENT ON COLUMN "onZapSession"."platform" IS 'Device platform: android, ios, web, unknown';
COMMENT ON COLUMN "onZapSession"."syncHistory" IS 'Sync message history on connect';
COMMENT ON COLUMN "onZapSession"."historySyncStatus" IS 'History sync status: pending, syncing, completed';
COMMENT ON COLUMN "onZapSession"."apiKey" IS 'Session-specific API key for authentication';

CREATE UNIQUE INDEX IF NOT EXISTS "idx_onZapSession_apiKey" ON "onZapSession"("apiKey") WHERE "apiKey" IS NOT NULL;
