import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: automations, error } = await supabase
      .from('Automations')
      .select(`
        *,
        EmailTemplates ( Title, Subject )
      `)
      .order('Created_At', { ascending: false });

    // If table doesn't exist yet, we'll return empty instead of 500
    if (error && error.code === '42P01') {
      return NextResponse.json({ success: true, automations: [], message: 'Table not created yet' });
    }
    if (error) throw error;
    
    return NextResponse.json({ success: true, automations });
  } catch (error: any) {
    console.error('Automations GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { Trigger_Event, Action, Template_ID } = await req.json();

    if (!Trigger_Event || !Action || !Template_ID) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Automations')
      .insert({ Trigger_Event, Action, Template_ID })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, id: data.Automation_ID });
  } catch (error: any) {
    console.error('Automations POST API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { id, Is_Active } = await req.json();

    if (!id || typeof Is_Active !== 'boolean') {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from('Automations')
      .update({ Is_Active })
      .eq('Automation_ID', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Automations PUT API Error:', error);
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
      .from('Automations')
      .delete()
      .eq('Automation_ID', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Automations DELETE API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
