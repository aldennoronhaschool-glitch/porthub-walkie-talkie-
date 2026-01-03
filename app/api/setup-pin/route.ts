import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Generate PIN from Clerk ID
        const fallbackPin = userId.slice(-8).toUpperCase();
        const formattedPin = `${fallbackPin.slice(0, 4)}-${fallbackPin.slice(4)}`;

        // Check if PIN already exists
        const { data: existing } = await supabase
            .from('user_pins')
            .select('*')
            .eq('clerk_user_id', userId)
            .single();

        if (existing) {
            return NextResponse.json({
                message: 'PIN already exists',
                pin: existing.pin,
                user: existing
            });
        }

        // Insert PIN into database
        const { data: newPin, error } = await supabase
            .from('user_pins')
            .insert({
                clerk_user_id: userId,
                pin: formattedPin,
                username: user.firstName || user.username || 'User'
            })
            .select()
            .single();

        if (error) {
            console.error('Error inserting PIN:', error);
            return NextResponse.json({
                error: 'Failed to create PIN',
                details: error.message,
                hint: error.hint
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'PIN created successfully!',
            pin: newPin
        });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
