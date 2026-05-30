import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: agents, error } = await supabase
      .from('Agents')
      .select('*')
      .order('Created_At', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { Name, Role, System_Instructions, Is_Active } = body;

    const { data, error } = await supabase
      .from('Agents')
      .insert({ Name, Role, System_Instructions, Is_Active })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, agent: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { Agent_ID, Name, Role, System_Instructions, Is_Active } = body;

    const { data, error } = await supabase
      .from('Agents')
      .update({ Name, Role, System_Instructions, Is_Active })
      .eq('Agent_ID', Agent_ID)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, agent: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    const { error } = await supabase
      .from('Agents')
      .delete()
      .eq('Agent_ID', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
