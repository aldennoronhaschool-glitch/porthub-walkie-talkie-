# PortHub (Next.js Version)

A modern, real-time Walkie Talkie web app built with Next.js 14, Clerk, and Supabase.

## 🚀 Quick Start

1.  **Install Dependencies**
    ```bash
    cd porthub
    npm install
    ```

2.  **Setup Environment**
    - Rename `env_setup.txt` to `.env.local`
    - Add your **Clerk Secret Key** (from dashboard)
    - Add your **Supabase Keys** (already populated from previous setup)

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Open App**
    Visit `http://localhost:3000`

## 🛠️ Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Auth**: Clerk
-   **Database/Realtime**: Supabase
-   **Styling**: Tailwind CSS v4 + Lucide Icons
-   **UI**: Framer Motion (animations)

## 📁 Structure

-   `app/page.tsx`: Landing page
-   `app/channels/page.tsx`: Main app interface
-   `components/`: UI Components (Sidebar, Room)
-   `lib/`: Utilities (Supabase client)
