-- Disable RLS on voice_messages to allow Clerk-authenticated users to insert
ALTER TABLE voice_messages DISABLE ROW LEVEL SECURITY;
