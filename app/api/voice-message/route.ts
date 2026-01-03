import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the Service Role Key if available, 
// otherwise fall back to Anon key (which might still fail RLS if not disabled)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { receiverId, audioBlob, duration } = body;

        if (!receiverId || !audioBlob) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('voice_messages')
            .insert({
                sender_user_id: userId,
                receiver_user_id: receiverId,
                audio_blob: audioBlob,
                status: 'sent',
                duration_seconds: duration || 0
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: data });

    } catch (error) {
        console.error('Error in voice-message API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
