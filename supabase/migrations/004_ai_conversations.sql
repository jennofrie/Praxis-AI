-- AI Conversations and Caching Schema
-- Supports conversation history, response caching, and user isolation

-- ==============================================================================
-- AI CONVERSATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    preview TEXT,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user conversation lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);

-- ==============================================================================
-- AI MESSAGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    token_count INTEGER,
    model_used VARCHAR(100),
    provider VARCHAR(50),
    response_time_ms INTEGER,
    is_cached BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast message lookups by conversation
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at DESC);

-- ==============================================================================
-- AI RESPONSE CACHE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ai_response_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) NOT NULL UNIQUE,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    model_used VARCHAR(100),
    provider VARCHAR(50),
    token_count INTEGER,
    hit_count INTEGER DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_query_hash ON ai_response_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires_at ON ai_response_cache(expires_at);

-- ==============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Admin emails for special access
CREATE OR REPLACE FUNCTION is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_email IN ('markaberiongibson@gmail.com', 'daguiljennofrie@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conversations: Users can only see their own, admins can see all
DROP POLICY IF EXISTS "Users can view own conversations" ON ai_conversations;
CREATE POLICY "Users can view own conversations"
    ON ai_conversations FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "Users can insert own conversations" ON ai_conversations;
CREATE POLICY "Users can insert own conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON ai_conversations;
CREATE POLICY "Users can update own conversations"
    ON ai_conversations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON ai_conversations;
CREATE POLICY "Users can delete own conversations"
    ON ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Messages: Users can only see their own, admins can see all
DROP POLICY IF EXISTS "Users can view own messages" ON ai_messages;
CREATE POLICY "Users can view own messages"
    ON ai_messages FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "Users can insert own messages" ON ai_messages;
CREATE POLICY "Users can insert own messages"
    ON ai_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Cache: Read-only for all authenticated users, managed by system
DROP POLICY IF EXISTS "Authenticated users can read cache" ON ai_response_cache;
CREATE POLICY "Authenticated users can read cache"
    ON ai_response_cache FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role can manage cache" ON ai_response_cache;
CREATE POLICY "Service role can manage cache"
    ON ai_response_cache FOR ALL
    TO service_role
    USING (true);

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Auto-update conversation updated_at and message count
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_conversations
    SET
        updated_at = NOW(),
        last_message_at = NEW.created_at,
        message_count = message_count + 1,
        preview = CASE
            WHEN NEW.role = 'user' THEN LEFT(NEW.content, 100)
            ELSE preview
        END,
        title = CASE
            WHEN title = 'New Conversation' AND NEW.role = 'user'
            THEN LEFT(NEW.content, 50)
            ELSE title
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON ai_messages;
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Auto-update cache access time
CREATE OR REPLACE FUNCTION update_cache_on_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed_at = NOW();
    NEW.hit_count = OLD.hit_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cache_access ON ai_response_cache;
CREATE TRIGGER trigger_update_cache_access
    BEFORE UPDATE ON ai_response_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_cache_on_access();

-- ==============================================================================
-- CLEANUP FUNCTIONS
-- ==============================================================================

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_response_cache
    WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce max 20 conversations per user (delete oldest)
CREATE OR REPLACE FUNCTION enforce_conversation_limit()
RETURNS TRIGGER AS $$
DECLARE
    conversation_count INTEGER;
    user_email TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;

    -- Skip limit for admins
    IF is_admin_user(user_email) THEN
        RETURN NEW;
    END IF;

    -- Count existing conversations
    SELECT COUNT(*) INTO conversation_count
    FROM ai_conversations
    WHERE user_id = NEW.user_id AND NOT is_archived;

    -- If over limit, archive oldest conversations
    IF conversation_count >= 20 THEN
        UPDATE ai_conversations
        SET is_archived = TRUE
        WHERE id IN (
            SELECT id FROM ai_conversations
            WHERE user_id = NEW.user_id AND NOT is_archived
            ORDER BY updated_at ASC
            LIMIT (conversation_count - 19)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_conversation_limit ON ai_conversations;
CREATE TRIGGER trigger_enforce_conversation_limit
    BEFORE INSERT ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION enforce_conversation_limit();

-- ==============================================================================
-- GRANTS
-- ==============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT ON ai_messages TO authenticated;
GRANT SELECT ON ai_response_cache TO authenticated;
GRANT ALL ON ai_response_cache TO service_role;
