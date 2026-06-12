import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET - Dashboard: list all bookings for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('Session_Bookings')
      .select('*, Sessions(Session_Type, Service_Type, Duration_Minutes, Location)')
      .eq('user_id', user.id)
      .order('Booked_Date', { ascending: true });

    if (status) query = query.eq('Status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, bookings: data });
  } catch (error: any) {
    console.error('Session Bookings GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Public: submit a new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userId, clientName, clientEmail, clientPhone, bookedDate, bookedTime, notes } = body;

    if (!sessionId || !userId || !clientName || !clientEmail || !bookedDate || !bookedTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('Session_Bookings')
      .insert({
        user_id: userId,
        Session_ID: sessionId,
        Client_Name: clientName,
        Client_Email: clientEmail,
        Client_Phone: clientPhone || '',
        Booked_Date: bookedDate,
        Booked_Time: bookedTime,
        Notes: notes || '',
        Status: 'Pending'
      })
      .select('*, Sessions(Session_Type, Service_Type)')
      .single();

    if (bookingError) throw bookingError;

    // Fetch owner email settings
    const { data: config } = await supabase
      .from('AppConfig')
      .select('Admin_Email, Email_User, Email_Pass, Company_Name')
      .eq('user_id', userId)
      .single();

    // Send confirmation email to client
    if (config?.Email_User && config?.Email_Pass && clientEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: config.Email_User, pass: config.Email_Pass }
        });

        const sessionName = booking.Sessions?.Session_Type || 'Session';
        const businessName = config.Company_Name || 'Us';
        const formattedDate = new Date(bookedDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        await transporter.sendMail({
          from: `"${businessName}" <${config.Email_User}>`,
          to: clientEmail,
          subject: `Booking Request Received — ${sessionName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
              <h2 style="color: #4da685;">Booking Request Received!</h2>
              <p>Hi ${clientName},</p>
              <p>We've received your booking request for <strong>${sessionName}</strong>. Here's a summary:</p>
              <table style="width:100%; border-collapse: collapse; margin: 1.5rem 0;">
                <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Session</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${sessionName}</td></tr>
                <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Date</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td></tr>
                <tr><td style="padding: 0.5rem; font-weight: bold;">Time</td><td style="padding: 0.5rem;">${bookedTime}</td></tr>
              </table>
              <p>Your request is currently <strong>pending review</strong>. We'll be in touch shortly to confirm your booking and send over your contract.</p>
              <p>Talk soon,<br/><strong>${businessName}</strong></p>
            </div>
          `
        });

        // Also notify the business owner
        if (config.Admin_Email) {
          await transporter.sendMail({
            from: `"Clover CRM" <${config.Email_User}>`,
            to: config.Admin_Email,
            subject: `New Booking Request — ${sessionName} on ${formattedDate}`,
            html: `
              <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #4da685;">New Booking Request</h2>
                <table style="width:100%; border-collapse: collapse; margin: 1rem 0;">
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Client</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${clientName}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Email</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${clientEmail}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Phone</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${clientPhone || 'N/A'}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Session</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${sessionName}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Date</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold;">Time</td><td style="padding: 0.5rem;">${bookedTime}</td></tr>
                  ${notes ? `<tr><td style="padding: 0.5rem; font-weight: bold;">Notes</td><td style="padding: 0.5rem;">${notes}</td></tr>` : ''}
                </table>
                <p>Log in to your dashboard to approve or decline this booking.</p>
              </div>
            `
          });
        }
      } catch (emailErr) {
        console.error('Email send error (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Session Bookings POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Dashboard: approve / reject a booking
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { bookingId, status } = await req.json();
    if (!bookingId || !status) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    const { error } = await supabase
      .from('Session_Bookings')
      .update({ Status: status })
      .eq('Booking_ID', bookingId)
      .eq('user_id', user.id);

    if (error) throw error;

    if (status === 'Approved') {
      const { data: booking } = await supabase
        .from('Session_Bookings')
        .select('*, Sessions(Service_Type)')
        .eq('Booking_ID', bookingId)
        .single();

      if (booking) {
        let contactId;
        const { data: existingContact } = await supabase
          .from('Contacts')
          .select('Contact_ID')
          .eq('Email', booking.Client_Email)
          .eq('user_id', user.id)
          .single();

        if (existingContact) {
          contactId = existingContact.Contact_ID;
        } else {
          const { data: newContact, error: contactErr } = await supabase
            .from('Contacts')
            .insert({
              user_id: user.id,
              Name: booking.Client_Name,
              Email: booking.Client_Email,
              Phone: booking.Client_Phone || '',
              Lead_Source: 'Online Booking'
            })
            .select()
            .single();

          if (!contactErr && newContact) contactId = newContact.Contact_ID;
        }

        if (contactId) {
          const { data: existingInq } = await supabase
            .from('Inquiries')
            .select('Inquiry_ID')
            .eq('Contact_ID', contactId)
            .eq('Event_Date', booking.Booked_Date)
            .single();

          if (!existingInq) {
            await supabase
              .from('Inquiries')
              .insert({
                user_id: user.id,
                Contact_ID: contactId,
                Service_Type: booking.Sessions?.Service_Type || 'Session',
                Event_Date: booking.Booked_Date,
                Pipeline_Stage: 'Booked',
                Estimated_Value: 0
              });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Session Bookings PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Dashboard: remove a booking
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase
      .from('Session_Bookings')
      .delete()
      .eq('Booking_ID', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Session Bookings DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
