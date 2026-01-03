-- Voice Messages Table for TenTen-style walkie talkie
CREATE TABLE IF NOT EXISTS voice_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_user_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    audio_url TEXT,
    audio_blob TEXT, -- Base64 encoded audio for small messages
    duration_seconds DECIMAL(5,2),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'played')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    played_at TIMESTAMPTZ,
    
    -- Indexes for fast queries
    CONSTRAINT fk_sender FOREIGN KEY (sender_user_id) REFERENCES user_pins(clerk_user_id) ON DELETE CASCADE,
    CONSTRAINT fk_receiver FOREIGN KEY (receiver_user_id) REFERENCES user_pins(clerk_user_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_voice_messages_receiver ON voice_messages(receiver_user_id, created_at DESC);
CREATE INDEX idx_voice_messages_sender ON voice_messages(sender_user_id, created_at DESC);
CREATE INDEX idx_voice_messages_status ON voice_messages(status);

-- Enable Row Level Security
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own messages" ON voice_messages
    FOR SELECT USING (
        auth.uid()::text = sender_user_id OR 
        auth.uid()::text = receiver_user_id
    );

CREATE POLICY "Users can send messages" ON voice_messages
    FOR INSERT WITH CHECK (auth.uid()::text = sender_user_id);

CREATE POLICY "Users can update their received messages" ON voice_messages
    FOR UPDATE USING (auth.uid()::text = receiver_user_id);

-- Enable Realtime for instant delivery
ALTER PUBLICATION supabase_realtime ADD TABLE voice_messages;

-- Function to auto-delete old messages (optional - keeps DB clean)
CREATE OR REPLACE FUNCTION delete_old_voice_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM voice_messages 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE voice_messages IS 'Stores voice messages for TenTen-style walkie talkie communication';
