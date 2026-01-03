import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// Send a friend request by PIN
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pin } = await request.json();

        if (!pin) {
            return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
        }

        // Find the user with this PIN
        const { data: targetUser, error: userError } = await supabase
            .from('user_pins')
            .select('clerk_user_id, username, pin')
            .eq('pin', pin.toUpperCase())
            .single();

        if (userError || !targetUser) {
            return NextResponse.json({ error: 'User not found with this PIN' }, { status: 404 });
        }

        // Check if trying to add yourself
        if (targetUser.clerk_user_id === userId) {
            return NextResponse.json({ error: 'You cannot add yourself as a friend' }, { status: 400 });
        }

        // Check if already friends
        const { data: existingFriendship } = await supabase
            .from('friends')
            .select('*')
            .or(`and(user_id_1.eq.${userId},user_id_2.eq.${targetUser.clerk_user_id}),and(user_id_1.eq.${targetUser.clerk_user_id},user_id_2.eq.${userId})`)
            .single();

        if (existingFriendship) {
            return NextResponse.json({ error: 'You are already friends with this user' }, { status: 400 });
        }

        // Check if request already exists
        const { data: existingRequest } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('sender_user_id', userId)
            .eq('receiver_user_id', targetUser.clerk_user_id)
            .eq('status', 'pending')
            .single();

        if (existingRequest) {
            return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
        }

        // Create friend request
        const { data: newRequest, error: requestError } = await supabase
            .from('friend_requests')
            .insert({
                sender_user_id: userId,
                receiver_user_id: targetUser.clerk_user_id,
                status: 'pending'
            })
            .select()
            .single();

        if (requestError) {
            console.error('Error creating friend request:', requestError);
            return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Friend request sent to ${targetUser.username || 'user'}!`,
            request: newRequest
        });
    } catch (error) {
        console.error('Error in friend-request POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Get all friend requests (sent and received)
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get received requests
        const { data: receivedRequests, error: receivedError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('receiver_user_id', userId)
            .eq('status', 'pending');

        // Get sent requests
        const { data: sentRequests, error: sentError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('sender_user_id', userId)
            .eq('status', 'pending');

        if (receivedError || sentError) {
            console.error('Error fetching requests:', receivedError || sentError);
            return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
        }

        // Fetch sender details for received requests
        const receivedWithDetails = await Promise.all(
            (receivedRequests || []).map(async (req) => {
                const { data: sender } = await supabase
                    .from('user_pins')
                    .select('clerk_user_id, username, pin')
                    .eq('clerk_user_id', req.sender_user_id)
                    .single();
                return { ...req, sender };
            })
        );

        // Fetch receiver details for sent requests
        const sentWithDetails = await Promise.all(
            (sentRequests || []).map(async (req) => {
                const { data: receiver } = await supabase
                    .from('user_pins')
                    .select('clerk_user_id, username, pin')
                    .eq('clerk_user_id', req.receiver_user_id)
                    .single();
                return { ...req, receiver };
            })
        );

        return NextResponse.json({
            received: receivedWithDetails,
            sent: sentWithDetails
        });
    } catch (error) {
        console.error('Error in friend-request GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Accept or reject a friend request
export async function PATCH(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { requestId, action } = await request.json();

        if (!requestId || !['accept', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Get the friend request
        const { data: friendRequest, error: fetchError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('id', requestId)
            .eq('receiver_user_id', userId)
            .single();

        if (fetchError || !friendRequest) {
            return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
        }

        if (friendRequest.status !== 'pending') {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
        }

        // Update request status
        const { error: updateError } = await supabase
            .from('friend_requests')
            .update({
                status: action === 'accept' ? 'accepted' : 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) {
            console.error('Error updating request:', updateError);
            return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
        }

        // If accepted, create friendship
        if (action === 'accept') {
            const [user1, user2] = [friendRequest.sender_user_id, friendRequest.receiver_user_id].sort();

            const { error: friendError } = await supabase
                .from('friends')
                .insert({
                    user_id_1: user1,
                    user_id_2: user2
                });

            if (friendError) {
                console.error('Error creating friendship:', friendError);
                return NextResponse.json({ error: 'Failed to create friendship' }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            message: action === 'accept' ? 'Friend request accepted!' : 'Friend request rejected'
        });
    } catch (error) {
        console.error('Error in friend-request PATCH:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
