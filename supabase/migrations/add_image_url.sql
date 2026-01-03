-- Add image_url column to user_pins table if it doesn't exist
ALTER TABLE user_pins ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Verify it worked
SELECT * FROM user_pins LIMIT 1;
