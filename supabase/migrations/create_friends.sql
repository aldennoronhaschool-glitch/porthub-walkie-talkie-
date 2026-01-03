-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_user_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_user_id, receiver_user_id)
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 TEXT NOT NULL,
    user_id_2 TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2) -- Ensure consistent ordering
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friends_user1 ON friends(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON friends(user_id_2);

-- Enable Row Level Security
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update requests they received" ON friend_requests;
DROP POLICY IF EXISTS "Users can view all friendships" ON friends;
DROP POLICY IF EXISTS "Users can create friendships" ON friends;

-- Policies for friend_requests
CREATE POLICY "Users can view their own requests" ON friend_requests
    FOR SELECT
    USING (true);

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update requests they received" ON friend_requests
    FOR UPDATE
    USING (true);

-- Policies for friends
CREATE POLICY "Users can view all friendships" ON friends
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create friendships" ON friends
    FOR INSERT
    WITH CHECK (true);
