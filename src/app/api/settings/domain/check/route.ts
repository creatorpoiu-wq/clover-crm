import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain')?.toLowerCase().trim();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const adminClient = createAdminClient(supabaseUrl, supabaseKey);

    const { data, error } = await adminClient
      .from('AppConfig')
      .select('user_id')
      .eq('Custom_Domain', domain)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (data && data.user_id !== user.id) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
