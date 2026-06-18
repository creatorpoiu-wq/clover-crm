import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ─── GET — list all subscribers ──────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('Newsletter_Subscribers')
      .select('*')
      .eq('user_id', user.id)
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, subscribers: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── POST — add a single subscriber ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { email, first_name, last_name, source = 'manual', tags = [] } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email is required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Newsletter_Subscribers')
      .upsert({ user_id: user.id, email: email.toLowerCase().trim(), first_name, last_name, source, tags, status: 'active' }, { onConflict: 'user_id,email', ignoreDuplicates: false })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, subscriber: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── DELETE — remove a subscriber ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    const { error } = await supabase
      .from('Newsletter_Subscribers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
