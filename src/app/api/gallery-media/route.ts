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
      .from('Gallery_Media')
      .insert({
        Gallery_ID: body.Gallery_ID,
        Album_ID: body.Album_ID || null,
        Media_Type: body.Media_Type || 'photo',
        Url: body.Url,
        Thumbnail_Url: body.Thumbnail_Url || body.Url,
        File_Name: body.File_Name || 'media',
        Caption: body.Caption || null,
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
    const { Media_ID, ...updates } = body;

    const { data, error } = await supabase
      .from('Gallery_Media')
      .update(updates)
      .eq('Media_ID', Media_ID)
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

    if (!id) throw new Error('Missing media id');

    const { error } = await supabase
      .from('Gallery_Media')
      .delete()
      .eq('Media_ID', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
