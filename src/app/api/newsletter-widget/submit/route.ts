import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email, firstName, lastName } = await req.json();

    if (!userId || !email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email and userId are required.' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Upsert subscriber (safe if email already exists for this user)
    const { error } = await supabase
      .from('Newsletter_Subscribers')
      .upsert(
        {
          user_id: userId,
          email: email.toLowerCase().trim(),
          first_name: firstName || null,
          last_name: lastName || null,
          source: 'website',
          status: 'active',
        },
        { onConflict: 'user_id,email' }
      );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Newsletter widget submit error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
