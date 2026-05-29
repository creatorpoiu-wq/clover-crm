import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const params = await context.params;
    
    // Check if the route includes ?public=true for the embed page
    const url = new URL(req.url);
    const isPublic = url.searchParams.get('public') === 'true';

    // If not public, enforce auth
    if (!isPublic) {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { data, error } = await supabase
      .from('Forms')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // If public, only return safe fields
    if (isPublic) {
      return NextResponse.json({ 
        success: true, 
        form: {
          id: data.id,
          title: data.title,
          description: data.description,
          fields: data.fields,
          theme_color: data.theme_color,
          submit_text: data.submit_text,
          success_message: data.success_message,
        }
      });
    }

    return NextResponse.json({ success: true, form: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const params = await context.params;
    const { data: userAuth } = await supabase.auth.getUser();
    
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, fields, theme_color, submit_text, success_message, auto_reply_message, questionnaire_link, questionnaire_button_text } = body;

    const { data, error } = await supabase
      .from('Forms')
      .update({
        title,
        description,
        fields,
        theme_color,
        submit_text,
        success_message,
        auto_reply_message,
        questionnaire_link,
        questionnaire_button_text,
      })
      .eq('id', params.id)
      .eq('user_id', userAuth.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, form: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const params = await context.params;
    const { data: userAuth } = await supabase.auth.getUser();
    
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('Forms')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userAuth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
