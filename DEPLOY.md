# 🚀 How to Deploy PortHub Walkie Talkie to Vercel

The app is ready for deployment! Follow these steps to get it live.

## 1. Prerequisites
- A [Vercel Account](https://vercel.com).
- A [GitHub Account](https://github.com) (recommended).
- Your standard **Clerk** and **Supabase** accounts ready.

## 2. Push to GitHub
If you haven't already, push your code to a new GitHub repository.
```bash
git init
git add .
git commit -m "First commit"
# Add your remote origin
# git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
# git push -u origin main
```

## 3. Deploy on Vercel
1. Go to **Vercel Dashboard** -> **Add New...** -> **Project**.
2. Import your GitHub repository.
3. **Environment Variables**: You MUST add the following variables in the Vercel Project Settings (Deployment):

| Variable Name | Value |
|Query | (Copy from your local .env.local) |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| `CLERK_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ey...` |

*(Note: `SUPABASE_SERVICE_ROLE_KEY` is NOT required for the current version)*.

4. Click **Deploy**! 🚀

## 4. Updates
Whenever you push changes to GitHub, Vercel will automatically redeploy the new version.
