import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all friends
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all friendships where user is involved
        const { data: friendships, error } = await supabase
            .from('friends')
            .select('*')
            .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

        if (error) {
            console.error('Error fetching friends:', error);
            return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
        }

        // Get friend user IDs
        const friendIds = friendships?.map(f =>
            f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
        ) || [];

        if (friendIds.length === 0) {
            return NextResponse.json({ friends: [] });
        }

        // Get friend details
        const { data: friendDetails, error: detailsError } = await supabase
            .from('user_pins')
            .select('clerk_user_id, username, pin, image_url')
            .in('clerk_user_id', friendIds);

        if (detailsError) {
            console.error('Error fetching friend details:', detailsError);
            return NextResponse.json({ error: 'Failed to fetch friend details' }, { status: 500 });
        }

        return NextResponse.json({ friends: friendDetails || [] });
    } catch (error) {
        console.error('Error in friends GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
