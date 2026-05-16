import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: templates, error } = await supabase
      .from('EmailTemplates')
      .select('*')
      .order('Template_ID', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('Templates API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { title, subject, body } = await req.json();

    if (!title || !subject || !body) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('EmailTemplates')
      .insert({ user_id: userAuth.user.id, Title: title, Subject: subject, Body: body })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, id: data.Template_ID });
  } catch (error: any) {
    console.error('Templates POST API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { id, title, subject, body } = await req.json();

    if (!id || !title || !subject || !body) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from('EmailTemplates')
      .update({ Title: title, Subject: subject, Body: body })
      .eq('Template_ID', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Templates PUT API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const { error } = await supabase
      .from('EmailTemplates')
      .delete()
      .eq('Template_ID', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Templates DELETE API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
