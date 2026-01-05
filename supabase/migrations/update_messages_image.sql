-- Add support for image messages and view-once features
-- We need these columns to store the ImageKit URLs and message types
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_view_once BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;
