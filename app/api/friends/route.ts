import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
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

        // Get friend details from Supabase
        const { data: friendDetails, error: detailsError } = await supabase
            .from('user_pins')
            .select('*')
            .in('clerk_user_id', friendIds);

        if (detailsError) {
            console.error('Error fetching friend details:', detailsError);
            return NextResponse.json({ error: 'Failed to fetch friend details' }, { status: 500 });
        }

        // FETCH FROM CLERK (Fallback for missing names/images)
        try {
            // clerkClient is an async function in newer SDKs
            // @ts-ignore
            const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;

            const clerkUsers = await client.users.getUserList({ userId: friendIds, limit: 100 });

            // Map Clerk data to enrich Supabase data
            const enrichedFriends = friendDetails?.map(f => {
                const clerkUser = clerkUsers.data.find((u: any) => u.id === f.clerk_user_id);
                // Prefer Supabase data if exists (updated by user), else fallback to Clerk
                const displayName = f.username || (clerkUser ? (clerkUser.firstName || clerkUser.username || `User ${f.pin}`) : null);
                const displayImage = f.image_url || clerkUser?.imageUrl;

                return {
                    ...f,
                    username: displayName,
                    image_url: displayImage
                };
            });

            return NextResponse.json({ friends: enrichedFriends || [] });

        } catch (clerkError) {
            console.error("Clerk fetch error (fallback to local):", clerkError);
            return NextResponse.json({ friends: friendDetails || [] });
        }

    } catch (error) {
        console.error('Error in friends GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
