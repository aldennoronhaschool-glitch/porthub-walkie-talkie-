# Automatic PIN Generation Setup

Your app now has **two ways** to generate unique PINs:

## ✅ Method 1: Automatic on Sign-Up (Recommended)

PINs are generated **instantly** when a user signs up via Clerk webhook.

### Setup Steps:

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Navigate to**: Your App → Webhooks
3. **Click**: "Add Endpoint"
4. **Enter Endpoint URL**: 
   - For local testing: Use ngrok or similar tunnel
   - For production: `https://yourdomain.com/api/webhooks/clerk`
5. **Select Events**: Check `user.created`
6. **Get Signing Secret**: Copy the webhook signing secret
7. **Add to `.env.local`**:
   ```
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
8. **Save** the webhook

### How It Works:
- User signs up with Clerk
- Clerk sends webhook to your app
- App automatically generates unique PIN (e.g., `A3F7-K9M2`)
- PIN is stored in Supabase
- User sees their PIN immediately on first login

---

## ✅ Method 2: Automatic on First Visit (Fallback)

If webhook isn't set up, PINs generate when user first visits the app.

### How It Works:
- User logs in and visits the app
- App calls `/api/user-pin`
- If no PIN exists, one is generated
- PIN is stored and displayed

---

## 🎯 Current Status

**Right now**, your app uses **Method 2** (first visit).

To enable **Method 1** (instant on sign-up):
1. Run the SQL migration in Supabase (from `SETUP_PINS.md`)
2. Set up the Clerk webhook (steps above)
3. Add `CLERK_WEBHOOK_SECRET` to `.env.local`

---

## 🔍 Testing

### Test Method 1 (Webhook):
1. Set up webhook
2. Create a new test user in Clerk
3. Check Supabase `user_pins` table - PIN should exist immediately

### Test Method 2 (First Visit):
1. Sign in to the app
2. PIN appears in your profile
3. Check Supabase - PIN is stored

---

## 📝 Notes

- Both methods work together as a fallback system
- Webhook is faster and more reliable
- First-visit generation ensures no user is left without a PIN
- PINs are **permanent** once generated
