import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { name } = await req.json();

    // Generate a shorter, readable PIN (e.g., TEAM-9X)
    const pin = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: room, error } = await supabase
        .from('rooms')
        .insert({
            name: name || `Room ${pin}`,
            pin: pin,
            created_by: userId
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add creator as participant
    await supabase.from('room_participants').insert({
        room_id: room.id,
        user_id: userId,
        role: 'owner'
    });

    return NextResponse.json(room);
}

export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Get rooms user is part of
    const { data: participations, error: pError } = await supabase
        .from('room_participants')
        .select('room_id')
        .eq('user_id', userId);

    if (pError) return NextResponse.json({ error: pError.message }, { status: 500 });

    const roomIds = participations.map(p => p.room_id);

    const { data: rooms, error } = await supabase
        .from('rooms')
        .select('*')
        .in('id', roomIds)
        .eq('is_active', true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(rooms);
}
