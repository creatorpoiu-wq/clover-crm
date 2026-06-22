import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await req.json();
    const { userId, draftId, name, subject, bodyHtml, audienceCriteria } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const payload = {
      user_id: userId,
      name: name || 'Untitled Draft',
      subject: subject || '',
      body_html: bodyHtml || '',
      audience_criteria: audienceCriteria || { type: 'all', value: 'all' },
      status: 'Draft',
      sent_count: 0
    };

    let data, error;
    if (draftId) {
      // Update existing draft
      const result = await supabase.from("Marketing_Campaigns")
        .update(payload)
        .eq('id', draftId)
        .eq('user_id', userId)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Create new draft
      const result = await supabase.from("Marketing_Campaigns")
        .insert([payload])
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Failed to save draft.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, draft: data });

  } catch (error: any) {
    console.error('Marketing draft API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
