import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const reqBody = await req.json();
    const { pin, userIdToAdd } = reqBody;

    // Find room by PIN
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('pin', pin)
        .single();

    if (roomError || !room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Add user (self or scanned user)
    let targetUserId = userIdToAdd || userId;

    if (reqBody.userPinToAdd) {
        const { data: userPinData } = await supabase
            .from('user_pins')
            .select('clerk_user_id')
            .eq('pin', reqBody.userPinToAdd)
            .single();

        if (userPinData) {
            targetUserId = userPinData.clerk_user_id;
        } else {
            return NextResponse.json({ error: "Invalid User PIN" }, { status: 404 });
        }
    }

    const { error: joinError } = await supabase
        .from('room_participants')
        .insert({
            room_id: room.id,
            user_id: targetUserId,
            role: 'member'
        });

    if (joinError) {
        if (joinError.code === '23505') { // Unique violation
            return NextResponse.json({ message: "Already in room" });
        }
        return NextResponse.json({ error: joinError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, roomId: room.id });
}
