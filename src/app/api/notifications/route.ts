import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // last 7 days

    const [
      { data: newContacts },
      { data: newComms },
      { data: signedContracts },
      { data: paidInvoices },
      { data: newBookings },
      { data: newInquiries },
    ] = await Promise.all([
      // New contacts
      supabase
        .from('Contacts')
        .select('Contact_ID, Name, Lead_Source, created_at')
        .eq('user_id', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10),

      // New inbound emails / form submissions (Client-originated communications)
      supabase
        .from('Communications')
        .select('Comm_ID, Last_Contact_By, Last_Contact_Date, Message, Inquiry_ID')
        .eq('user_id', user.id)
        .in('Last_Contact_By', ['Client'])
        .gte('Last_Contact_Date', since)
        .order('Last_Contact_Date', { ascending: false })
        .limit(10),

      // Recently signed contracts/proposals
      supabase
        .from('Contracts')
        .select('Contract_ID, Contract_Title, Status, Signed_Date, Type, Inquiry_ID')
        .eq('user_id', user.id)
        .in('Status', ['Signed', 'Accepted'])
        .gte('Signed_Date', since)
        .order('Signed_Date', { ascending: false })
        .limit(10),

      // Recently paid invoices
      supabase
        .from('Invoices')
        .select('Invoice_ID, Invoice_Title, Status, Total_Amount, created_at')
        .eq('user_id', user.id)
        .in('Status', ['Paid', 'Partial Paid'])
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10),

      // New Session Bookings
      supabase
        .from('Session_Bookings')
        .select('Booking_ID, Client_Name, Created_At, Sessions(Session_Type)')
        .eq('user_id', user.id)
        .gte('Created_At', since)
        .order('Created_At', { ascending: false })
        .limit(10),

      // New Inquiries (Disabled due to lack of created_at column)
      Promise.resolve({ data: [] as any[] }),
    ]);

    type Notification = {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      time: string;
      href: string;
      icon: string;
    };

    const notifications: Notification[] = [];

    // New contacts
    for (const c of newContacts || []) {
      notifications.push({
        id: `contact-${c.Contact_ID}`,
        type: 'contact',
        title: 'New Contact',
        subtitle: `${c.Name}${c.Lead_Source ? ` via ${c.Lead_Source}` : ''}`,
        time: c.created_at,
        href: `/dashboard/contacts/${c.Contact_ID}`,
        icon: 'user',
      });
    }

    // New emails / form submissions
    for (const m of newComms || []) {
      const isForm = m.Message?.toLowerCase().includes('form') || m.Last_Contact_By !== 'Client';
      notifications.push({
        id: `comm-${m.Comm_ID}`,
        type: isForm ? 'form' : 'email',
        title: isForm ? 'New Form Submission' : 'New Email',
        subtitle: m.Message ? m.Message.replace('[Email] ', '').split('\n')[0].substring(0, 60) : 'New message received',
        time: m.Last_Contact_Date,
        href: `/dashboard/hub`,
        icon: isForm ? 'form' : 'mail',
      });
    }

    // Signed contracts / proposals
    for (const c of signedContracts || []) {
      const isProposal = c.Type === 'Proposal';
      notifications.push({
        id: `contract-${c.Contract_ID}`,
        type: isProposal ? 'proposal' : 'contract',
        title: isProposal ? 'Proposal Accepted' : 'Contract Signed',
        subtitle: c.Contract_Title || 'Document signed',
        time: c.Signed_Date,
        href: `/dashboard/finance`,
        icon: 'check',
      });
    }

    // Paid invoices
    for (const inv of paidInvoices || []) {
      notifications.push({
        id: `invoice-${inv.Invoice_ID}`,
        type: 'payment',
        title: inv.Status === 'Partial Paid' ? 'Partial Payment Received' : 'Invoice Paid',
        subtitle: `${inv.Invoice_Title}${inv.Total_Amount ? ` — $${Number(inv.Total_Amount).toLocaleString()}` : ''}`,
        time: inv.created_at,
        href: `/dashboard/finance`,
        icon: 'dollar',
      });
    }

    // New Bookings
    for (const b of newBookings || []) {
      const sessionType = (b.Sessions as any)?.Session_Type || (Array.isArray(b.Sessions) ? (b.Sessions as any)[0]?.Session_Type : 'Session');
      notifications.push({
        id: `booking-${b.Booking_ID}`,
        type: 'booking',
        title: 'New Booking Request',
        subtitle: `${b.Client_Name} — ${sessionType}`,
        time: b.Created_At,
        href: `/dashboard/bookings?bookingId=${b.Booking_ID}`,
        icon: 'calendar',
      });
    }

    // New Inquiries
    for (const inq of newInquiries || []) {
      const contactName = (inq.Contacts as any)?.Name || (Array.isArray(inq.Contacts) ? (inq.Contacts as any)[0]?.Name : 'Someone');
      notifications.push({
        id: `inquiry-${inq.Inquiry_ID}`,
        type: 'inquiry',
        title: 'New Inquiry',
        subtitle: `${contactName} inquired about ${inq.Session_Type || 'services'}`,
        time: inq.created_at,
        href: `/dashboard/portrait-settings`, // Direct to inquiries page
        icon: 'mail',
      });
    }

    // Sort all notifications by time descending
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({ success: true, notifications: notifications.slice(0, 20) });
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
