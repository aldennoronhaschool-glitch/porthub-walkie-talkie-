-- Add support for image messages and view-once features
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_view_once BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;

-- Ensure storage bucket exists (if possible via SQL, otherwise User must create 'chat-images' in Dashboard)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Allow Generic Access for simplicity, matching app constraints)
CREATE POLICY "Public Read" ON storage.objects FOR SELECT 
USING ( bucket_id = 'chat-images' );

CREATE POLICY "Public Upload" ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'chat-images' );
