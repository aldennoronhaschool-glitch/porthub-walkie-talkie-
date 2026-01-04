import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { generateUniquePin } from '@/lib/pinGenerator';

// Use Service Role Key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        console.log('🔍 user-pin API called');
        const { userId } = await auth();

        console.log('👤 User ID:', userId);

        if (!userId) {
            console.log('❌ No user ID - unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user already has a PIN
        console.log('📡 Checking for existing PIN in database...');
        const { data: existingPin, error: fetchError } = await supabase
            .from('user_pins')
            .select('*')
            .eq('clerk_user_id', userId)
            .single();

        if (fetchError) {
            console.log('⚠️ Fetch error:', fetchError);
            // If error is "not found", that's okay - we'll create a new PIN
            if (fetchError.code !== 'PGRST116') {
                console.error('Unexpected error:', fetchError);
            }
        }

        if (existingPin) {
            console.log('✅ Found existing PIN:', existingPin.pin);
            return NextResponse.json({
                pin: existingPin.pin,
                username: existingPin.username,
                image_url: existingPin.image_url
            });
        }

        console.log('🆕 No existing PIN, generating new one...');

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

        const body = await request.json();
        const { username, image_url } = body;

        const updateData: any = { updated_at: new Date().toISOString() };
        if (username !== undefined) updateData.username = username;
        if (image_url !== undefined) updateData.image_url = image_url;

        // Update profile
        const { data, error } = await supabase
            .from('user_pins')
            .update(updateData)
            .eq('clerk_user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            // Don't fail if column missing (fallback) but better to fail
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return NextResponse.json({
            pin: data.pin,
            username: data.username,
            image_url: data.image_url
        });
    } catch (error) {
        console.error('Error in user-pin POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
