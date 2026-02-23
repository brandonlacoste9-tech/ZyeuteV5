-- Group Chat Migration - Update messaging schema for N-participant conversations

-- 1. Add type and metadata to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
ADD COLUMN IF NOT EXISTS title VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Create conversation_participants table (replaces participant_a/b)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    muted_until TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,
    last_read_message_id UUID,
    
    UNIQUE(conversation_id, user_id)
);

-- 3. Migrate existing direct conversations to new structure
-- Create participant records for existing conversations
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
SELECT 
    id as conversation_id,
    participant_a as user_id,
    CASE WHEN participant_a = created_by THEN 'owner' ELSE 'member' END as role,
    created_at as joined_at
FROM conversations
WHERE type = 'direct' OR type IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
SELECT 
    id as conversation_id,
    participant_b as user_id,
    CASE WHEN participant_b = created_by THEN 'owner' ELSE 'member' END as role,
    created_at as joined_at
FROM conversations
WHERE type = 'direct' OR type IS NULL
ON CONFLICT DO NOTHING;

-- 4. Migrate unread counts from old columns to new table
UPDATE conversation_participants cp
SET unread_count = c.unread_count_a
FROM conversations c
WHERE cp.conversation_id = c.id 
  AND cp.user_id = c.participant_a
  AND (c.type = 'direct' OR c.type IS NULL);

UPDATE conversation_participants cp
SET unread_count = c.unread_count_b
FROM conversations c
WHERE cp.conversation_id = c.id 
  AND cp.user_id = c.participant_b
  AND (c.type = 'direct' OR c.type IS NULL);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);

-- 6. Update trigger function for unread counts (works for N participants)
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Update conversation timestamp
    UPDATE conversations 
    SET updated_at = NOW(),
        last_message_id = NEW.id,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    -- Increment unread count for all participants except sender
    UPDATE conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Add group settings table for advanced features
CREATE TABLE IF NOT EXISTS group_settings (
    conversation_id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
    join_rule VARCHAR(20) DEFAULT 'invite' CHECK (join_rule IN ('invite', 'link', 'open')),
    invite_link VARCHAR(100),
    invite_link_expires_at TIMESTAMPTZ,
    slow_mode_seconds INTEGER DEFAULT 0,
    only_admins_can_post BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Add pinned messages
CREATE TABLE IF NOT EXISTS pinned_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL REFERENCES users(id),
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(conversation_id, message_id)
);

-- 9. Function to get conversation participants with user info
CREATE OR REPLACE FUNCTION get_conversation_participants(conv_id UUID)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    display_name VARCHAR,
    avatar_url TEXT,
    role VARCHAR,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        cp.role,
        EXISTS (
            SELECT 1 FROM user_presence up 
            WHERE up.user_id = u.id 
            AND up.last_seen > NOW() - INTERVAL '5 minutes'
        ) as is_online
    FROM conversation_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.conversation_id = conv_id
    ORDER BY 
        CASE cp.role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            ELSE 3 
        END,
        u.display_name;
END;
$$ LANGUAGE plpgsql;

-- 10. View for conversation list with participant info
CREATE OR REPLACE VIEW conversation_list AS
SELECT 
    c.id,
    c.type,
    c.title,
    c.avatar_url,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.ephemeral_mode,
    c.encryption_enabled,
    json_agg(
        json_build_object(
            'user_id', u.id,
            'username', u.username,
            'display_name', u.display_name,
            'avatar_url', u.avatar_url,
            'role', cp.role
        ) ORDER BY cp.joined_at
    ) FILTER (WHERE u.id IS NOT NULL) as participants
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN users u ON cp.user_id = u.id
GROUP BY c.id;
