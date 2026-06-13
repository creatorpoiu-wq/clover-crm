import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const businessSlug = searchParams.get('businessSlug');
    const publicUserId = searchParams.get('userId');

    // Public fetch by businessSlug and slug (for booking page)
    if (slug && businessSlug) {
      const supabase = getServiceClient();
      
      // 1. Find user_id from businessSlug
      const { data: configData, error: configError } = await supabase
        .from('AppConfig')
        .select('user_id')
        .eq('Business_Slug', businessSlug)
        .limit(1);

      if (configError || !configData || configData.length === 0) {
        return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
      }
      
      const targetUserId = configData[0].user_id;

      // 2. Fetch the session for that user
      const { data, error } = await supabase
        .from('Sessions')
        .select('*, Session_Time_Slots(*), Packages(*)')
        .eq('Slug', slug)
        .eq('user_id', targetUserId)
        .eq('Is_Public', true)
        .limit(1);

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      if (!data || data.length === 0) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      
      return NextResponse.json({ success: true, session: data[0] });
    }

    // Public fetch by legacy slug fallback (if needed, though links will be updated)
    if (slug && !businessSlug) {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('Sessions')
        .select('*, Session_Time_Slots(*), Packages(*)')
        .eq('Slug', slug)
        .eq('Is_Public', true)
        .limit(1);

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      if (!data || data.length === 0) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      
      return NextResponse.json({ success: true, session: data[0] });
    }

    // Public fetch all sessions for a userId (booking directory)
    if (publicUserId) {
      const supabase = getServiceClient();
      const { data: sessions, error } = await supabase
        .from('Sessions')
        .select('*, Session_Time_Slots(*), Packages(*)')
        .eq('user_id', publicUserId)
        .eq('Is_Public', true)
        .order('Created_At', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, sessions });
    }

    // Auth'd fetch for dashboard
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: sessions, error } = await supabase
      .from('Sessions')
      .select('*, Session_Time_Slots(*), Packages(*)')
      .eq('user_id', user.id)
      .order('Service_Type', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error('Sessions GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { serviceType, sessionType, slug, description, coverImage, durationMinutes, location, isPublic, price, contractTemplate } = body;

    if (!serviceType || !sessionType) {
      return NextResponse.json({ success: false, error: 'Service type and session type are required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Sessions')
      .insert({
        user_id: user.id,
        Service_Type: serviceType,
        Session_Type: sessionType,
        Slug: slug || sessionType.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        Description: description || '',
        Cover_Image: coverImage || '',
        Duration_Minutes: durationMinutes || 60,
        Location: location || '',
        Is_Public: isPublic !== false,
        Price: price || 0,
        Contract_Template: contractTemplate || ''
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, session: data });
  } catch (error: any) {
    console.error('Sessions POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, serviceType, sessionType, slug, description, coverImage, durationMinutes, location, isPublic, price, contractTemplate } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Missing session ID' }, { status: 400 });

    const { error } = await supabase
      .from('Sessions')
      .update({
        Service_Type: serviceType,
        Session_Type: sessionType,
        Slug: slug,
        Description: description,
        Cover_Image: coverImage,
        Duration_Minutes: durationMinutes,
        Location: location,
        Is_Public: isPublic,
        Price: price,
        Contract_Template: contractTemplate
      })
      .eq('Session_ID', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sessions PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase
      .from('Sessions')
      .delete()
      .eq('Session_ID', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sessions DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
