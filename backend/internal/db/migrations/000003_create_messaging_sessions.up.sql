CREATE TABLE messaging_sessions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected',
    session_data BYTEA,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_messaging_sessions_tenant_id ON messaging_sessions(tenant_id);
CREATE INDEX idx_messaging_sessions_channel_id ON messaging_sessions(channel_id);
CREATE INDEX idx_messaging_sessions_platform ON messaging_sessions(platform);
