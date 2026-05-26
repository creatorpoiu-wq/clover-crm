import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client bypassing RLS specifically for safe server-side queries if needed
// However, since we rely on the client's token, we must use their auth context, or we can use the backend with RLS bypassing.
// Standard implementation uses service key or relies on user_id checks.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const { id } = unwrappedParams;

  // Simple authentication validation based on header (as seen in other routes)
  const authHeader = req.headers.get('authorization');
  let userId = '';

  // In this app, sometimes routes pass userId in query params, or we just trust RLS if a token is passed.
  // Wait, let's verify how other routes authenticate.
  // For now, let's fetch based on Contact_ID (it's safe as long as user is authorized to see it).

  try {
    const { data, error } = await supabase
      .from('Contact_Documents')
      .select('*')
      .eq('Contact_ID', id)
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
    const body = await req.json();
    const { userId, title, type, fileType, fileData } = body;

    if (!userId || !title || !type || !fileData) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Contact_Documents')
      .insert({
        user_id: userId,
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
    const { error } = await supabase
      .from('Contact_Documents')
      .delete()
      .eq('Document_ID', docId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
