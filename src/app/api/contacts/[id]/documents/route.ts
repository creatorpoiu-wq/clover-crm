import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const { id } = unwrappedParams;

  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = userAuth.user.id;

    const { data, error } = await supabase
      .from('Contact_Documents')
      .select('*')
      .eq('Contact_ID', id)
      .eq('user_id', userId)
      .order('Upload_Date', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, documents: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const { id } = unwrappedParams;

  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, type, fileType, fileData } = body;

    if (!title || !type || !fileData) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Contact_Documents')
      .insert({
        user_id: userAuth.user.id,
        Contact_ID: parseInt(id),
        Title: title,
        Type: type,
        File_Type: fileType,
        File_Data: fileData
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, document: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const { id } = unwrappedParams; // Contact_ID
  
  // Note: the URL might be /api/contacts/[id]/documents?docId=123
  const url = new URL(req.url);
  const docId = url.searchParams.get('docId');

  if (!docId) {
    return NextResponse.json({ success: false, error: 'Document ID required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = userAuth.user.id;

    const { error } = await supabase
      .from('Contact_Documents')
      .delete()
      .eq('Document_ID', docId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
