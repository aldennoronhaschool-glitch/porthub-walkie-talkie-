# Room System Setup

To enable Group Rooms, run the following SQL in your Supabase SQL Editor.
**NOTE:** This script will drop existing `rooms` and `room_participants` tables (CASTALDE) to ensure schema compatibility.

```sql
-- Re-runnable migration with CASCADE
DROP TABLE IF EXISTS room_participants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    pin TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member', -- 'owner' or 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rooms_pin ON rooms(pin);
CREATE INDEX IF NOT EXISTS idx_participants_user ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_room ON room_participants(room_id);

-- RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can view their rooms" ON room_participants FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON room_participants FOR INSERT WITH CHECK (true);
```

## Features
1. **Create Room**: Generates a unique Room PIN.
2. **Room QR**: Displayed to creator.
3. **Scanner**: Creator can scan user QR codes to add them to the room.
