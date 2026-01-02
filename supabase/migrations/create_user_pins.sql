-- Create user_pins table to store unique PINs for each user

CREATE TABLE IF NOT EXISTS user_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    pin TEXT UNIQUE NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_pins_clerk_id ON user_pins(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_pins_pin ON user_pins(pin);

-- Enable Row Level Security
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all pins (for friend lookup)
CREATE POLICY "Allow read access to all users" ON user_pins
    FOR SELECT
    USING (true);

-- Create policy to allow users to insert their own pin
CREATE POLICY "Allow insert own pin" ON user_pins
    FOR INSERT
    WITH CHECK (true);

-- Create policy to allow users to update their own pin
CREATE POLICY "Allow update own pin" ON user_pins
    FOR UPDATE
    USING (true);
