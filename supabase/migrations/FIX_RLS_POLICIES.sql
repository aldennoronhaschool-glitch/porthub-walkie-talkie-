-- Fix RLS policies for user_pins table

-- First, disable RLS temporarily to test
ALTER TABLE user_pins DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, update the policies:
-- Drop all existing policies
DROP POLICY IF EXISTS "Allow read access to all users" ON user_pins;
DROP POLICY IF EXISTS "Allow insert own pin" ON user_pins;
DROP POLICY IF EXISTS "Allow update own pin" ON user_pins;

-- Re-enable RLS
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that allow all operations
CREATE POLICY "Enable read access for all users" ON user_pins
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON user_pins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_pins
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_pins
    FOR DELETE USING (true);
