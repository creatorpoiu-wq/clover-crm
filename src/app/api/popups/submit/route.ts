import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { popupId, userId, name, email } = body;

    if (!popupId || !userId || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // 1. Fetch Popup Details to know the internal name (for tagging)
    const { data: popup } = await supabase
      .from('Marketing_Popups')
      .select('internal_name, conversion_count')
      .eq('id', popupId)
      .single();

    if (!popup) {
      return NextResponse.json({ success: false, error: 'Popup not found' }, { status: 404 });
    }

    const tagName = `Popup: ${popup.internal_name}`;

    // 2. Find or Create Contact
    const { data: existingContact } = await supabase
      .from('Contacts')
      .select('Contact_ID, Tags')
      .eq('user_id', userId)
      .eq('Email', email)
      .single();

    let contactId;
    
    if (existingContact) {
      contactId = existingContact.Contact_ID;
      
      // Update tags if needed
      let existingTags: string[] = [];
      if (Array.isArray(existingContact.Tags)) {
        existingTags = existingContact.Tags;
      } else if (typeof existingContact.Tags === 'string') {
        existingTags = existingContact.Tags.split(',').map(t => t.trim()).filter(t => t);
      }

      if (!existingTags.includes(tagName)) {
        existingTags.push(tagName);
        await supabase
          .from('Contacts')
          .update({ Tags: existingTags })
          .eq('Contact_ID', contactId);
      }
    } else {
      // Create new contact
      const { data: newContact, error: createError } = await supabase
        .from('Contacts')
        .insert({
          user_id: userId,
          Name: name || 'Unknown',
          Email: email,
          Tags: [tagName]
        })
        .select('Contact_ID')
        .single();

      if (createError || !newContact) {
        throw new Error('Failed to create contact');
      }
      contactId = newContact.Contact_ID;
    }

    // 3. Increment Conversion Count
    await supabase
      .from('Marketing_Popups')
      .update({ conversion_count: (popup.conversion_count || 0) + 1 })
      .eq('id', popupId);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Popup submit error:", err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
