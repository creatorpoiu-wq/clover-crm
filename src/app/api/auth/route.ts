import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// This old PIN-based auth endpoint is now deprecated in favor of Supabase Auth.
// It is kept as a compatibility shim — it now simply checks if the user has a valid
// Supabase session and returns their company name.
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { data: config } = await supabase
      .from('AppConfig')
      .select('Company_Name')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ success: true, companyName: config?.Company_Name || '' });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
