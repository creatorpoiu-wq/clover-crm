import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const VERCEL_API_URL = 'https://api.vercel.com';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain } = await req.json();

    if (!domain || !domain.includes('.')) {
      return NextResponse.json({ error: 'Invalid domain name' }, { status: 400 });
    }

    const projectId = process.env.VERCEL_PROJECT_ID;
    const token = process.env.VERCEL_API_TOKEN;

    if (!projectId || !token) {
      return NextResponse.json({ error: 'Vercel API credentials missing in environment variables.' }, { status: 500 });
    }

    // 1. Add domain to Vercel
    const vercelRes = await fetch(`${VERCEL_API_URL}/v10/projects/${projectId}/domains`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    const vercelData = await vercelRes.json();

    if (!vercelRes.ok && vercelData.error?.code !== 'forbidden' && vercelData.error?.code !== 'domain_already_in_use') {
      return NextResponse.json({ error: vercelData.error?.message || 'Failed to add domain to Vercel' }, { status: vercelRes.status });
    }

    // 2. Save to AppConfig
    const { error: dbError } = await supabase
      .from('AppConfig')
      .update({ Custom_Domain: domain })
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ error: 'Failed to save domain in database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, domain: vercelData });
  } catch (error: any) {
    console.error('Domain Add Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const projectId = process.env.VERCEL_PROJECT_ID;
    const token = process.env.VERCEL_API_TOKEN;

    if (!projectId || !token) {
      return NextResponse.json({ error: 'Vercel configuration missing.' }, { status: 500 });
    }

    const vercelRes = await fetch(`${VERCEL_API_URL}/v9/projects/${projectId}/domains/${domain}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const vercelData = await vercelRes.json();
    
    if (!vercelRes.ok) {
      return NextResponse.json({ error: vercelData.error?.message || 'Failed to fetch domain status' }, { status: vercelRes.status });
    }

    return NextResponse.json({ success: true, status: vercelData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain } = await req.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const projectId = process.env.VERCEL_PROJECT_ID;
    const token = process.env.VERCEL_API_TOKEN;

    if (projectId && token) {
      // Remove from Vercel
      await fetch(`${VERCEL_API_URL}/v9/projects/${projectId}/domains/${domain}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Remove from DB
    await supabase
      .from('AppConfig')
      .update({ Custom_Domain: null })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
