import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'sessions') {
      const { data: sessions, error } = await supabase
        .from('Sessions')
        .select('*')
        .order('Created_At', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, sessions });
    }

    if (type === 'packages') {
      const { data: packages, error } = await supabase
        .from('Packages')
        .select('*')
        .order('Created_At', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, packages });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Packages API GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { type } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (type === 'session') {
      const { serviceType, sessionType } = body;
      if (!serviceType || !sessionType) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
      
      const { data, error } = await supabase
        .from('Sessions')
        .insert({
          user_id: userAuth.user.id,
          Service_Type: serviceType,
          Session_Type: sessionType
        })
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ success: true, id: data.Session_ID });
    }

    if (type === 'package') {
      const { sessionId, name, duration, items, description, price } = body;
      if (!sessionId || !name) return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      
      const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);
      
      const { data, error } = await supabase
        .from('Packages')
        .insert({
          user_id: userAuth.user.id,
          Session_ID: sessionId,
          Name: name,
          Duration: duration || '',
          Items: itemsJson,
          Description: description || '',
          Price: parseFloat(price) || 0
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, id: data.Package_ID });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Packages API POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { type } = body;

    if (type === 'session') {
      const { id, serviceType, sessionType } = body;
      const { error } = await supabase
        .from('Sessions')
        .update({
          Service_Type: serviceType,
          Session_Type: sessionType
        })
        .eq('Session_ID', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (type === 'package') {
      const { id, sessionId, name, duration, items, description, price } = body;
      const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);
      
      const { error } = await supabase
        .from('Packages')
        .update({
          Session_ID: sessionId,
          Name: name,
          Duration: duration || '',
          Items: itemsJson,
          Description: description || '',
          Price: parseFloat(price) || 0
        })
        .eq('Package_ID', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Packages API PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    if (type === 'session') {
      const { error } = await supabase.from('Sessions').delete().eq('Session_ID', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (type === 'package') {
      const { error } = await supabase.from('Packages').delete().eq('Package_ID', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Packages API DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
