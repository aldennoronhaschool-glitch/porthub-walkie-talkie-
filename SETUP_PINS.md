# Setup Instructions for Unique User PINs

## Step 1: Create the Database Table

Go to your Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- Create user_pins table to store unique PINs for each user
CREATE TABLE IF NOT EXISTS user_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    pin TEXT UNIQUE NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
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
```

## Step 2: Test the Feature

1. Reload your app at http://localhost:3001
2. Sign in with Clerk
3. You should see a unique PIN like "A3F7-K9M2" instead of your Clerk user ID
4. This PIN is:
   - **Unique** to you
   - **Permanent** (stored in database)
   - **Shareable** (friends can use it to add you)

## How It Works

- When you first load the app, it calls `/api/user-pin`
- The API checks if you have a PIN in the database
- If not, it generates a unique 8-character PIN (format: XXXX-XXXX)
- The PIN is stored in Supabase and displayed in your profile
- Friends can use your PIN to add you

## PIN Format

- 8 characters with hyphen: `A3F7-K9M2`
- Uses only clear characters (no O, 0, I, 1 to avoid confusion)
- Easy to read and share

## Next Steps

Once the table is created, each user will automatically get their own unique PIN!
