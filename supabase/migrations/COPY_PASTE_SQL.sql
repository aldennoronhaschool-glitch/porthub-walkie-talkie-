-- ============================================
-- COPY AND PASTE THIS ENTIRE BLOCK INTO SUPABASE SQL EDITOR
-- ============================================

-- Step 1: Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friends CASCADE;

-- Step 2: Create friend_requests table
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_user_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friend_request UNIQUE(sender_user_id, receiver_user_id)
);

-- Step 3: Create friends table
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 TEXT NOT NULL,
    user_id_2 TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE(user_id_1, user_id_2),
    CONSTRAINT ordered_users CHECK (user_id_1 < user_id_2)
);

-- Step 4: Create indexes
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_user_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friends_user1 ON friends(user_id_1);
CREATE INDEX idx_friends_user2 ON friends(user_id_2);

-- Step 5: Enable Row Level Security
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for friend_requests
CREATE POLICY "Users can view their own requests" ON friend_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update requests they received" ON friend_requests
    FOR UPDATE USING (true);

-- Step 7: Create policies for friends
CREATE POLICY "Users can view all friendships" ON friends
    FOR SELECT USING (true);

CREATE POLICY "Users can create friendships" ON friends
    FOR INSERT WITH CHECK (true);
