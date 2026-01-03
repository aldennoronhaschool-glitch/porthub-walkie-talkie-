import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Test Supabase connection
        const { data, error } = await supabase
            .from('user_pins')
            .select('count')
            .limit(1);

        if (error) {
            return NextResponse.json({
                status: '❌ Supabase Error',
                error: error.message,
                hint: error.hint,
                details: error.details
            }, { status: 500 });
        }

        return NextResponse.json({
            status: '✅ Supabase Connected',
            message: 'Database connection successful!',
            tableExists: true
        });
    } catch (error: any) {
        return NextResponse.json({
            status: '❌ Connection Failed',
            error: error.message,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set (hidden)' : 'NOT SET',
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'NOT SET'
        }, { status: 500 });
    }
}
