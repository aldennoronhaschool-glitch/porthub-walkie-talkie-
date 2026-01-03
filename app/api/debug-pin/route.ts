import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Create Supabase client with detailed error logging
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key (first 20 chars):', supabaseKey?.substring(0, 20));

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Generate PIN
        const fallbackPin = userId.slice(-8).toUpperCase();
        const formattedPin = `${fallbackPin.slice(0, 4)}-${fallbackPin.slice(4)}`;

        console.log('Attempting to insert:', {
            clerk_user_id: userId,
            pin: formattedPin,
            username: user.firstName || user.username || 'User'
        });

        // Try to insert
        const { data, error } = await supabase
            .from('user_pins')
            .insert({
                clerk_user_id: userId,
                pin: formattedPin,
                username: user.firstName || user.username || 'User'
            })
            .select();

        if (error) {
            console.error('Full Supabase error:', JSON.stringify(error, null, 2));
            return NextResponse.json({
                error: 'Failed to create PIN',
                supabaseError: error,
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'PIN created successfully!',
            data: data
        });
    } catch (error: any) {
        console.error('Caught error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
