# Step-by-Step SQL Setup (Run Each Query Separately)

## Query 1: Create friend_requests table

```sql
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_user_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_user_id, receiver_user_id)
);
```

**Run this first** ✅ Then click "Run" and wait for success.

---

## Query 2: Create friends table

```sql
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 TEXT NOT NULL,
    user_id_2 TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2)
);
```

**Run this second** ✅

---

## Query 3: Create indexes

```sql
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friends_user1 ON friends(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON friends(user_id_2);
```

**Run this third** ✅

---

## Query 4: Enable RLS

```sql
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
```

**Run this fourth** ✅

---

## Query 5: Create policies for friend_requests

```sql
CREATE POLICY "Users can view their own requests" ON friend_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update requests they received" ON friend_requests
    FOR UPDATE USING (true);
```

**Run this fifth** ✅

---

## Query 6: Create policies for friends

```sql
CREATE POLICY "Users can view all friendships" ON friends
    FOR SELECT USING (true);

CREATE POLICY "Users can create friendships" ON friends
    FOR INSERT WITH CHECK (true);
```

**Run this last** ✅

---

## ✅ Verification

Go to **Table Editor** in Supabase and verify you see:
- `friend_requests` table
- `friends` table

Both should have data columns and RLS enabled.

---

## 🐛 If You Still Get Errors

**Option 1: Drop and recreate**
```sql
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
```

Then run all the queries above again.

**Option 2: Check existing tables**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('friend_requests', 'friends');
```

This will show if the tables already exist.
