import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { confirmText } = await req.json();

    if (confirmText !== "RESET") {
      return NextResponse.json({ success: false, error: "Invalid confirmation text." }, { status: 400 });
    }

    // Delete all Contacts (This should cascade and delete Inquiries, Communications, Contracts, Invoices, Meetings, Reminders)
    // We will explicitly delete from other tables just in case cascading isn't set up on all of them.
    
    // 1. Delete standalone data first to avoid FK constraint issues if cascades are missing
    await supabase.from('Reminders').delete().eq('user_id', user.id);
    await supabase.from('Meetings').delete().eq('user_id', user.id);
    await supabase.from('Communications').delete().eq('user_id', user.id);
    await supabase.from('Expenses').delete().eq('user_id', user.id);
    await supabase.from('Invoices').delete().eq('user_id', user.id);
    await supabase.from('Contracts').delete().eq('user_id', user.id);
    await supabase.from('Deliverables').delete().eq('user_id', user.id);
    
    // 2. Delete Inquiries
    await supabase.from('Inquiries').delete().eq('user_id', user.id);

    // 3. Delete Contacts
    const { error: contactsError } = await supabase.from('Contacts').delete().eq('user_id', user.id);

    if (contactsError) throw contactsError;

    return NextResponse.json({ success: true, message: "CRM data has been successfully reset." });
  } catch (error: any) {
    console.error("Reset CRM Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
