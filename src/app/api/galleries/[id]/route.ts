import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET can be public or auth'd
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const isPublic = url.searchParams.get('public') === 'true';

    let supabase;
    if (isPublic) {
      // Use service role for public access to bypass RLS issues, check Is_Published manually
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    } else {
      supabase = await createServerClient();
    }

    // Fetch gallery
    const query = supabase.from('Galleries').select('*');
    
    // id could be Slug or ID depending on the request type
    if (isNaN(Number(id))) {
      query.eq('Slug', id);
    } else {
      query.eq('Gallery_ID', id);
    }

    const { data: gallery, error } = await query.single();

    if (error) throw error;

    if (isPublic && !gallery.Is_Published) {
      throw new Error('Gallery not published');
    }

    // Fetch albums
    const { data: albums, error: albumsError } = await supabase
      .from('Gallery_Albums')
      .select('*')
      .eq('Gallery_ID', gallery.Gallery_ID)
      .order('Sort_Order', { ascending: true });

    if (albumsError) throw albumsError;

    // Fetch media
    const { data: media, error: mediaError } = await supabase
      .from('Gallery_Media')
      .select('*')
      .eq('Gallery_ID', gallery.Gallery_ID)
      .order('Sort_Order', { ascending: true })
      .order('Created_At', { ascending: true });

    if (mediaError) throw mediaError;

    const { data: config } = await supabase.from('AppConfig').select('Custom_Domain, Company_Name').eq('user_id', gallery.User_ID).single();

    return NextResponse.json({ 
      success: true, 
      data: { ...gallery, albums: albums || [], media: media || [] },
      customDomain: config?.Custom_Domain,
      companyName: config?.Company_Name
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { data, error } = await supabase
      .from('Galleries')
      .update(body)
      .eq('Gallery_ID', id)
      .eq('User_ID', user.id) // Ensure ownership
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('Galleries')
      .delete()
      .eq('Gallery_ID', id)
      .eq('User_ID', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
