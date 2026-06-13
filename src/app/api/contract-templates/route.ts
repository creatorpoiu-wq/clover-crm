import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: templates, error } = await supabase
      .from('Contract_Templates')
      .select('*')
      .order('Created_At', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('Contract Templates GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { name, content } = await req.json();
    if (!name || !content) {
      return NextResponse.json({ success: false, error: 'Name and content are required' }, { status: 400 });
    }

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('Contract_Templates')
      .insert({
        user_id: userAuth.user.id,
        Name: name.trim(),
        Content: content
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, id: data.Template_ID });
  } catch (error: any) {
    console.error('Contract Templates POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase
      .from('Contract_Templates')
      .delete()
      .eq('Template_ID', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contract Templates DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { id, name, content } = await req.json();
    if (!id || !name || !content) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    const { error } = await supabase
      .from('Contract_Templates')
      .update({ Name: name.trim(), Content: content })
      .eq('Template_ID', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contract Templates PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
