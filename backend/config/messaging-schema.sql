-- Zyeuté Messaging Schema - Real User-to-User Chat
-- Secure, ephemeral-ready, Quebec-themed

-- Conversations (chat threads)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participants (exactly 2 for DM, expandable for groups)
    participant_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Last message reference for inbox preview
    last_message_id UUID,
    last_message_at TIMESTAMPTZ,
    
    -- Unread counts per participant
    unread_count_a INTEGER DEFAULT 0,
    unread_count_b INTEGER DEFAULT 0,
    
    -- Ephemeral settings (per conversation)
    ephemeral_mode BOOLEAN DEFAULT false, -- Snapchat-style auto-delete
    ephemeral_ttl_seconds INTEGER DEFAULT 86400, -- 24h default
    
    -- Encryption (optional E2E)
    encryption_enabled BOOLEAN DEFAULT false,
    encryption_public_key_a TEXT,
    encryption_public_key_b TEXT,
    
    -- Soft delete (privacy)
    deleted_by_a_at TIMESTAMPTZ,
    deleted_by_b_at TIMESTAMPTZ,
    
    UNIQUE(participant_a, participant_b)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Sender
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content (encrypted or plaintext)
    content_type VARCHAR(20) NOT NULL DEFAULT 'text', -- text, image, video, voice, file
    content_text TEXT, -- For text messages
    content_url TEXT, -- For media files (S3/Supabase)
    content_metadata JSONB, -- Duration, size, dimensions, etc.
    
    -- Encryption
    is_encrypted BOOLEAN DEFAULT false,
    encryption_iv TEXT, -- Initialization vector for decryption
    
    -- Ephemeral
    is_ephemeral BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    
    -- Status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    -- Delivery tracking
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Reactions (stored as JSON array)
    reactions JSONB DEFAULT '[]'::jsonb
);

-- Message reactions (normalized for querying)
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction VARCHAR(50) NOT NULL, -- emoji or reaction name
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, reaction)
);

-- Voice message metadata
CREATE TABLE voice_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    
    -- Audio details
    duration_seconds INTEGER NOT NULL,
    waveform_data JSONB, -- Array of amplitude values for visualization
    
    -- Playback tracking
    play_count INTEGER DEFAULT 0,
    played_by JSONB DEFAULT '[]'::jsonb -- Array of user IDs who played
);

-- Typing indicators (ephemeral, Redis-backed in production)
CREATE TABLE typing_status (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (conversation_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_conversations_participant_a ON conversations(participant_a);
CREATE INDEX idx_conversations_participant_b ON conversations(participant_b);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_expires ON messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_messages_read ON messages(read_at) WHERE read_at IS NULL;

-- Function to update conversation timestamps
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW(),
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        unread_count_a = CASE WHEN participant_a != NEW.sender_id THEN unread_count_a + 1 ELSE unread_count_a END,
        unread_count_b = CASE WHEN participant_b != NEW.sender_id THEN unread_count_b + 1 ELSE unread_count_b END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_message_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to clean up expired ephemeral messages
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM messages 
    WHERE is_ephemeral = true 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
