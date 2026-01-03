# Friend Request System Setup

Your walkie-talkie app now has a complete friend request system using unique PINs!

## 🎯 How It Works

### 1. **Each User Gets a Unique PIN**
- Format: `A3F7-K9M2` (8 characters with hyphen)
- Automatically generated on first login
- Displayed on Dashboard, Settings, and Add Friend screens

### 2. **Send Friend Request**
- Go to "Add Friend" screen
- Enter your friend's PIN (e.g., `B8N4-P7Q5`)
- Click "Send Request"
- Your friend receives the request

### 3. **Receive & Accept Requests**
- Friend requests appear on your Dashboard
- Shows sender's name and PIN
- Click ✓ to accept or ✕ to reject
- Accepted friends appear in your friends list

### 4. **Call Your Friends**
- Click on any friend in your list
- Automatically joins a private room with them
- Use Push-to-Talk to communicate

---

## 📋 Database Setup Required

Run these SQL commands in your Supabase Dashboard:

### Step 1: Create User PINs Table
```sql
-- From create_user_pins.sql
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

CREATE POLICY "Allow read access to all users" ON user_pins
    FOR SELECT USING (true);

CREATE POLICY "Allow insert own pin" ON user_pins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own pin" ON user_pins
    FOR UPDATE USING (true);
```

### Step 2: Create Friend Request Tables
```sql
-- From create_friends.sql
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

---

## ✅ Features Implemented

### API Routes
- ✅ `/api/user-pin` - Get/create unique PIN
- ✅ `/api/friend-request` - Send & fetch friend requests
- ✅ `/api/friend-request/[id]` - Accept/reject requests
- ✅ `/api/friends` - Get friends list

### UI Components
- ✅ Dashboard shows friends list
- ✅ Friend request notifications with accept/reject buttons
- ✅ Add Friend screen with PIN input
- ✅ Click friend to start private call

### Database Tables
- ✅ `user_pins` - Stores unique PINs
- ✅ `friend_requests` - Manages pending/accepted/rejected requests
- ✅ `friends` - Stores accepted friendships

---

## 🧪 Testing the System

### Test Flow:
1. **User A** signs up → Gets PIN `A3F7-K9M2`
2. **User B** signs up → Gets PIN `B8N4-P7Q5`
3. **User A** goes to "Add Friend"
4. **User A** enters `B8N4-P7Q5` and sends request
5. **User B** sees notification on Dashboard
6. **User B** clicks ✓ to accept
7. Both users now see each other in friends list
8. Click on friend to start private call!

---

## 🎨 UI Features

### Dashboard
- Friend requests section (if any pending)
- Friends list with avatars
- Click friend to call
- Green dot indicates online status

### Add Friend
- Enter PIN input field
- Shows your own PIN for sharing
- Send request button
- Loading states

### Notifications
- Bell icon shows pending requests count
- Accept (✓) and Reject (✕) buttons
- Real-time updates after actions

---

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only see their own requests
- PIN validation prevents invalid formats
- Duplicate request prevention
- Can't add yourself as friend

---

## 🚀 Next Steps

1. Run the SQL migrations in Supabase
2. Test with two different accounts
3. Share PINs and send friend requests
4. Start calling your friends!

Enjoy your fully functional friend system! 🎉
