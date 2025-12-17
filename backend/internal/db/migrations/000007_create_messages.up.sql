CREATE TABLE messages (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL,
    whatsapp_msg_id VARCHAR(255),
    body TEXT,
    media_url VARCHAR(500),
    media_type VARCHAR(100),
    from_me BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    ack INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_from_me ON messages(from_me);
