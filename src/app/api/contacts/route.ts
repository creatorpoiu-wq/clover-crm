import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userAuth.user.id;

    const { data: contacts, error } = await supabase
      .from('Contacts')
      .select('*, Packages (Name)')
      .eq('user_id', userId)
      .order('Contact_ID', { ascending: false });

    if (error) throw error;

    // Flatten the package name into the contact object
    const formattedContacts = contacts.map((c: any) => ({
      ...c,
      Package_Name: c.Packages?.Name || null
    }));

    return NextResponse.json({ success: true, contacts: formattedContacts });
  } catch (error: any) {
    console.error('Contacts API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userAuth.user.id;

    const { id, name, email, phone, leadSource, packageId, company, address, status } = await req.json();
    
    if (!id || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from('Contacts')
      .update({
        Name: name,
        Email: email || "",
        Phone: phone || "",
        Lead_Source: leadSource || "Website",
        Package_ID: packageId || null,
        Company: company || null,
        Address: address || null,
        Status: status || "Lead"
      })
      .eq('Contact_ID', id)
      .eq('user_id', userId);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contacts API PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userAuth.user.id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const { error } = await supabase
      .from('Contacts')
      .delete()
      .eq('Contact_ID', id)
      .eq('user_id', userId);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contacts API DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
