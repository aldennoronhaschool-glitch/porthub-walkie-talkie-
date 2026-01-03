-- Disable RLS on all tables to ensure smooth operation with Clerk auth
ALTER TABLE user_pins DISABLE ROW LEVEL SECURITY;
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;
