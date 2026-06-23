import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Security check: ensure user owns the gallery
    const { data: gallery } = await supabase
      .from('Galleries')
      .select('User_ID')
      .eq('Gallery_ID', body.Gallery_ID)
      .single();

    if (!gallery || gallery.User_ID !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('Gallery_Albums')
      .insert({
        Gallery_ID: body.Gallery_ID,
        Name: body.Name,
        Sort_Order: body.Sort_Order || 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { Album_ID, ...updates } = body;

    // The RLS policy on Gallery_Albums handles checking if the user owns the parent gallery
    const { data, error } = await supabase
      .from('Gallery_Albums')
      .update(updates)
      .eq('Album_ID', Album_ID)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) throw new Error('Missing album id');

    const { error } = await supabase
      .from('Gallery_Albums')
      .delete()
      .eq('Album_ID', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
