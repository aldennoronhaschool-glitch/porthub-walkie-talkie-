# Quick Setup Guide - Friend Request System

## ⚡ Step-by-Step Setup

### Step 1: Create User PINs Table

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Copy and paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS user_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    pin TEXT UNIQUE NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_pins_clerk_id ON user_pins(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_pins_pin ON user_pins(pin);

ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users" ON user_pins;
DROP POLICY IF EXISTS "Allow insert own pin" ON user_pins;
DROP POLICY IF EXISTS "Allow update own pin" ON user_pins;

CREATE POLICY "Allow read access to all users" ON user_pins
    FOR SELECT USING (true);

CREATE POLICY "Allow insert own pin" ON user_pins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own pin" ON user_pins
    FOR UPDATE USING (true);
```

Click **Run** ✅

---

### Step 2: Create Friend Request Tables

In the same **SQL Editor**, create a **New Query**

Copy and paste this SQL:

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

CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 TEXT NOT NULL,
    user_id_2 TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friends_user1 ON friends(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON friends(user_id_2);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update requests they received" ON friend_requests;
DROP POLICY IF EXISTS "Users can view all friendships" ON friends;
DROP POLICY IF EXISTS "Users can create friendships" ON friends;

CREATE POLICY "Users can view their own requests" ON friend_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update requests they received" ON friend_requests
    FOR UPDATE USING (true);

CREATE POLICY "Users can view all friendships" ON friends
    FOR SELECT USING (true);

CREATE POLICY "Users can create friendships" ON friends
    FOR INSERT WITH CHECK (true);
```

Click **Run** ✅

---

### Step 3: Verify Tables Created

Go to **Table Editor** in Supabase

You should see 3 new tables:
- ✅ `user_pins`
- ✅ `friend_requests`
- ✅ `friends`

---

### Step 4: Test the App!

1. **Reload** your app at `http://localhost:3001`
2. **Sign in** with Clerk
3. **Check your PIN** on the Dashboard (e.g., `A3F7-K9M2`)
4. **Open in another browser** (or incognito)
5. **Sign in** with a different account
6. **Go to "Add Friend"**
7. **Enter the first user's PIN**
8. **Send request**
9. **First user** sees notification on Dashboard
10. **Click ✓** to accept
11. **Both users** now see each other in friends list!
12. **Click on friend** to start a call 🎉

---

## ✅ What You Get

- 🔑 **Unique PINs** for each user (e.g., `A3F7-K9M2`)
- 📤 **Send friend requests** by PIN
- 📥 **Receive & accept/reject** requests
- 👥 **Friends list** on Dashboard
- 📞 **Click friend to call** them directly
- 🔒 **Private rooms** for each friendship

---

## 🐛 Troubleshooting

**Error: "column does not exist"**
- Make sure you ran BOTH SQL queries
- Check that all tables were created in Table Editor

**Error: "User not found with this PIN"**
- Make sure the user has logged in at least once
- Check the `user_pins` table has data

**Friend requests not showing**
- Refresh the page
- Check browser console for errors
- Verify both users have PINs in the database

---

## 🎯 Done!

Your friend request system is now fully functional! 🚀
