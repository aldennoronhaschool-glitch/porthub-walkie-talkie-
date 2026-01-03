-- ============================================
-- COMPLETE DATABASE SETUP - RUN THIS FIRST
-- Copy and paste this ENTIRE block into Supabase SQL Editor
-- ============================================

-- Step 1: Drop all existing tables (clean slate)
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS user_pins CASCADE;

-- ============================================
-- PART 1: USER PINS TABLE
-- ============================================

-- Create user_pins table
CREATE TABLE user_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    pin TEXT UNIQUE NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_pins
CREATE INDEX idx_user_pins_clerk_id ON user_pins(clerk_user_id);
CREATE INDEX idx_user_pins_pin ON user_pins(pin);

-- Enable RLS for user_pins
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;

-- Create policies for user_pins
CREATE POLICY "Allow read access to all users" ON user_pins
    FOR SELECT USING (true);

CREATE POLICY "Allow insert own pin" ON user_pins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own pin" ON user_pins
    FOR UPDATE USING (true);

-- ============================================
-- PART 2: FRIEND REQUESTS TABLE
-- ============================================

-- Create friend_requests table
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_user_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friend_request UNIQUE(sender_user_id, receiver_user_id)
);

-- Create indexes for friend_requests
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_user_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);

-- Enable RLS for friend_requests
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for friend_requests
CREATE POLICY "Users can view their own requests" ON friend_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update requests they received" ON friend_requests
    FOR UPDATE USING (true);

-- ============================================
-- PART 3: FRIENDS TABLE
-- ============================================

-- Create friends table
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 TEXT NOT NULL,
    user_id_2 TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE(user_id_1, user_id_2),
    CONSTRAINT ordered_users CHECK (user_id_1 < user_id_2)
);

-- Create indexes for friends
CREATE INDEX idx_friends_user1 ON friends(user_id_1);
CREATE INDEX idx_friends_user2 ON friends(user_id_2);

-- Enable RLS for friends
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Create policies for friends
CREATE POLICY "Users can view all friendships" ON friends
    FOR SELECT USING (true);

CREATE POLICY "Users can create friendships" ON friends
    FOR INSERT WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that all tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('user_pins', 'friend_requests', 'friends')
ORDER BY table_name;
