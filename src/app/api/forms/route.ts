import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('Forms')
      .select('id, title, description, theme_color, created_at')
      .eq('user_id', userAuth.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, forms: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, fields, theme_color, submit_text, success_message, auto_reply_message, questionnaire_link, questionnaire_button_text } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Forms')
      .insert({
        user_id: userAuth.user.id,
        title,
        description,
        fields: fields || [],
        theme_color: theme_color || '#0f172a',
        submit_text: submit_text || 'Submit',
        success_message: success_message || 'Thank you! Your submission has been received.',
        auto_reply_message: auto_reply_message || null,
        questionnaire_link: questionnaire_link || null,
        questionnaire_button_text: questionnaire_button_text || 'Complete Intake Questionnaire',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, form: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
