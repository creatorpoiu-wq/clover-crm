import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'templates') {
      const { data: templates, error } = await supabase
        .from('Questionnaire_Templates')
        .select('*')
        .order('Created_At', { ascending: false });
      
      if (error) throw error;
      return NextResponse.json({ success: true, templates });
    }

    if (type === 'fields') {
      const templateId = searchParams.get('templateId');
      
      let query = supabase.from('Questionnaire_Fields').select('*').order('Order_Index', { ascending: true });
      if (templateId) {
        query = query.eq('Template_ID', templateId);
      }
      
      const { data: fields, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, fields });
    }

    if (type === 'settings') {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

      const { data: settings, error } = await supabase
        .from('Booking_Settings')
        .select('*')
        .eq('user_id', userAuth.user.id)
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      return NextResponse.json({ success: true, settings: settings || {} });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Questionnaire API GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { type } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = userAuth.user.id;

    if (type === 'template') {
      const { name } = body;
      if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
      
      const { data, error } = await supabase
        .from('Questionnaire_Templates')
        .insert({
          user_id: userId,
          Name: name.trim()
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, id: data.Template_ID });
    }

    if (type === 'field') {
      const { templateId, label, fieldType, options, isRequired, orderIndex } = body;
      if (!label || !fieldType || !templateId) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
      
      const { data, error } = await supabase
        .from('Questionnaire_Fields')
        .insert({
          user_id: userId,
          Template_ID: templateId,
          Label: label,
          Type: fieldType,
          Options: options || '',
          Is_Required: isRequired ? true : false,
          Order_Index: orderIndex || 0
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, id: data.Field_ID });
    }

    if (type === 'settings') {
      const { contractTemplateId, questionnaireTemplateId } = body;
      const updatePayload: any = {};
      if (contractTemplateId !== undefined) updatePayload.Contract_Template_ID = contractTemplateId;
      if (questionnaireTemplateId !== undefined) updatePayload.Questionnaire_Template_ID = questionnaireTemplateId;

      const { error } = await supabase
        .from('Booking_Settings')
        .update(updatePayload)
        .eq('user_id', userId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Questionnaire API POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { type } = body;

    if (type === 'field') {
      const { id, label, fieldType, options, isRequired, orderIndex } = body;
      
      const { error } = await supabase
        .from('Questionnaire_Fields')
        .update({
          Label: label,
          Type: fieldType,
          Options: options || '',
          Is_Required: isRequired ? true : false,
          Order_Index: orderIndex || 0
        })
        .eq('Field_ID', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Questionnaire API PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    if (type === 'template') {
      const { error } = await supabase.from('Questionnaire_Templates').delete().eq('Template_ID', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (type === 'field') {
      const { error } = await supabase.from('Questionnaire_Fields').delete().eq('Field_ID', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Questionnaire API DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
