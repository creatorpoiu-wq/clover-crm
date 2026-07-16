import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const supabase = await createClient();

    let query = supabase.from('Store_Products').select('*').order('Created_At', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { Name, Category, Base_Price, Image_Url, Description } = body;

    if (!Name || !Category) {
      return NextResponse.json({ success: false, error: 'Name and Category are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Store_Products')
      .insert([{
        user_id: user.id,
        Name,
        Category,
        Base_Price: Base_Price || 0,
        Image_Url: Image_Url || null,
        Description: Description || null
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
