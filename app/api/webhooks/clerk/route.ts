import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { generateUniquePin } from '@/lib/pinGenerator';

// Use Service Role Key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400,
        });
    }

    // Handle the webhook
    const eventType = evt.type;

    if (eventType === 'user.created') {
        const { id, first_name, last_name } = evt.data;

        // Generate a unique PIN for the new user
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

        // Store the PIN
        const { error } = await supabase
            .from('user_pins')
            .insert({
                clerk_user_id: id,
                pin: pin,
                username: first_name || null,
            });

        if (error) {
            console.error('Error creating PIN for new user:', error);
            return new Response('Error creating PIN', { status: 500 });
        }

        console.log(`✅ Created PIN ${pin} for user ${id}`);
    }

    return new Response('', { status: 200 });
}
