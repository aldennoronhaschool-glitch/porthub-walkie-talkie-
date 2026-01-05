-- Create messages table for 1-on-1 chat
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Allow anonymous access (matching previous RLS settings)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON messages FOR ALL USING (true) WITH CHECK (true);
