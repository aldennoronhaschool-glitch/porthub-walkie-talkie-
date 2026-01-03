import { NextResponse } from 'next/server';

export async function GET() {
    const diagnostics = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
        clerkPublishable: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
        clerkSecret: process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing',
        zegoAppId: process.env.NEXT_PUBLIC_ZEGO_APP_ID ? '✅ Set' : '❌ Missing',
        zegoSecret: process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET ? '✅ Set' : '❌ Missing',
    };

    return NextResponse.json(diagnostics);
}
