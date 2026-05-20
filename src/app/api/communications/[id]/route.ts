import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const params = await props.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Communication ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from('Communications')
      .delete()
      .eq('Communication_ID', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Communications DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
