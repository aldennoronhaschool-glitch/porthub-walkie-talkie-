import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { generateUniquePin } from '@/lib/pinGenerator';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user already has a PIN
        const { data: existingPin, error: fetchError } = await supabase
            .from('user_pins')
            .select('pin, username')
            .eq('clerk_user_id', userId)
            .single();

        if (existingPin) {
            return NextResponse.json({ pin: existingPin.pin, username: existingPin.username });
        }

        // Generate a new unique PIN
        let pin = generateUniquePin();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure PIN is unique
        while (attempts < maxAttempts) {
            const { data: duplicate } = await supabase
                .from('user_pins')
                .select('pin')
                .eq('pin', pin)
                .single();

            if (!duplicate) break;

            pin = generateUniquePin();
            attempts++;
        }

        if (attempts >= maxAttempts) {
            return NextResponse.json({ error: 'Failed to generate unique PIN' }, { status: 500 });
        }

        // Store the new PIN
        const { data: newPin, error: insertError } = await supabase
            .from('user_pins')
            .insert({
                clerk_user_id: userId,
                pin: pin,
                username: null
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting PIN:', insertError);
            return NextResponse.json({ error: 'Failed to create PIN' }, { status: 500 });
        }

        return NextResponse.json({ pin: newPin.pin, username: newPin.username });
    } catch (error) {
        console.error('Error in user-pin API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username } = await request.json();

        // Update username
        const { data, error } = await supabase
            .from('user_pins')
            .update({ username, updated_at: new Date().toISOString() })
            .eq('clerk_user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating username:', error);
            return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
        }

        return NextResponse.json({ pin: data.pin, username: data.username });
    } catch (error) {
        console.error('Error in user-pin POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
