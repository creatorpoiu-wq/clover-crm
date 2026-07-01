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
    const { sessionId, userId, clientName, clientEmail, clientPhone, bookedDate, bookedTime, notes, packageId, contractHtml, signature, amountPaid, endTime } = body;

    if (!sessionId || !userId || !clientName || !clientEmail || !bookedDate || !bookedTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const insertData: any = {
      user_id: userId,
      Session_ID: sessionId,
      Client_Name: clientName,
      Client_Email: clientEmail,
      Client_Phone: clientPhone || '',
      Booked_Date: bookedDate,
      Booked_Time: bookedTime,
      Notes: notes || '',
      Package_ID: packageId || null,
      Contract_HTML: contractHtml || null,
      Signature: signature || null,
      Amount_Paid: amountPaid || 0,
      Status: 'Approved'
    };
    if (endTime) insertData['End_Time'] = endTime;

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('Session_Bookings')
      .insert(insertData)
      .select('*, Sessions(Session_Type, Service_Type)')
      .single();

    if (bookingError) {
      console.error("Session Booking Insert Error:", bookingError);
      throw bookingError;
    }

    // Auto-block the calendar for this time slot
    if (endTime) {
      let formattedStartTime = bookedTime;
      if (formattedStartTime && formattedStartTime.length <= 5) {
        formattedStartTime += ":00";
      }
      const { error: blockError } = await supabase.from('Blocked_Dates').insert({
        user_id: userId,
        Start_Date: bookedDate,
        End_Date: bookedDate,
        Is_All_Day: false,
        Start_Time: formattedStartTime,
        End_Time: endTime
      });
      if (blockError) {
        console.error("Failed to auto-insert Blocked_Date:", blockError);
      }
    }

    // Automatically create/update Contact and Inquiry since the booking is Approved
    let contactId;
    const { data: existingContact } = await supabase
      .from('Contacts')
      .select('Contact_ID')
      .eq('Email', clientEmail)
      .eq('user_id', userId)
      .single();

    if (existingContact) {
      contactId = existingContact.Contact_ID;
      const updatePayload: any = { Status: 'Client' };
      if (packageId) updatePayload.Package_ID = packageId;
      await supabase.from('Contacts').update(updatePayload).eq('Contact_ID', contactId);
    } else {
      const { data: newContact, error: contactErr } = await supabase
        .from('Contacts')
        .insert({
          user_id: userId,
          Name: clientName,
          Email: clientEmail,
          Phone: clientPhone || '',
          Lead_Source: 'Online Booking',
          Package_ID: packageId || null,
          Status: 'Client'
        })
        .select()
        .single();

      if (!contactErr && newContact) contactId = newContact.Contact_ID;
    }

    let inquiryId = null;
    if (contactId) {
      const { data: newInquiry, error: inquiryError } = await supabase
        .from('Inquiries')
        .insert({
          user_id: userId,
          Contact_ID: contactId,
          Service_Type: booking.Sessions?.Service_Type || booking.Sessions?.Session_Type || 'Session',
          Event_Date: bookedDate,
          Pipeline_Stage: 'Booked',
          Estimated_Value: amountPaid || 0
        })
        .select('Inquiry_ID')
        .single();

      if (inquiryError) {
        console.error("Inquiries insert error:", inquiryError);
      } else if (newInquiry) {
        inquiryId = newInquiry.Inquiry_ID;
      }
    }

    // If contract was signed during booking, save to Contracts table linked to Inquiry
    if (inquiryId && contractHtml) {
      const today = new Date().toISOString().split('T')[0];
      const { error: contractError } = await supabase
        .from('Contracts')
        .insert({
          user_id: userId,
          Inquiry_ID: inquiryId,
          Contract_Title: `${booking.Sessions?.Session_Type || booking.Sessions?.Service_Type || 'Session'} Contract`,
          Contract_Text: contractHtml,
          Status: 'Signed',
          Signed_Date: today,
          Client_Signature: signature || '',
          Type: 'Contract'
        });
      if (contractError) console.error("Contracts insert error:", contractError);
    }

    // Automatically create an Invoice record linked to the Inquiry so payments appear on Contact page
    if (inquiryId) {
      const today = new Date().toISOString().split('T')[0];
      const sessionName = booking.Sessions?.Session_Type || booking.Sessions?.Service_Type || 'Session';
      const lineItems = [{ description: sessionName, amount: Number(amountPaid) || 0, quantity: 1 }];
      const { error: invoiceError } = await supabase
        .from('Invoices')
        .insert({
          user_id: userId,
          Inquiry_ID: inquiryId,
          Invoice_Title: `${sessionName} Invoice`,
          Total_Amount: Number(amountPaid) || 0,
          Status: Number(amountPaid) > 0 ? 'Paid' : 'Unpaid',
          Due_Date: today,
          Line_Items: JSON.stringify(lineItems)
        });
      if (invoiceError) console.error("Invoices insert error:", invoiceError);
    }

    // Fetch owner email settings
    const { data: config } = await supabase
      .from('AppConfig')
      .select('Admin_Email, Email_User, Email_Pass, Company_Name, Custom_Domain')
      .eq('user_id', userId)
      .single();

    const host = req.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = config?.Custom_Domain
      ? `https://${config.Custom_Domain}`
      : (host ? `${protocol}://${host}` : req.nextUrl.origin);
    const portalLink = inquiryId ? `${baseUrl}/portal/${inquiryId}` : null;

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
          subject: `Booking Confirmed — ${sessionName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
              <h2 style="color: #4da685;">Booking Confirmed!</h2>
              <p>Hi ${clientName},</p>
              <p>Your session booking for <strong>${sessionName}</strong> is officially confirmed! Here's a summary of your booking:</p>
              <table style="width:100%; border-collapse: collapse; margin: 1.5rem 0;">
                <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Session</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${sessionName}</td></tr>
                <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Date</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td></tr>
                <tr><td style="padding: 0.5rem; font-weight: bold;">Time</td><td style="padding: 0.5rem;">${bookedTime}</td></tr>
              </table>
              ${portalLink ? `
                <div style="margin: 2rem 0; text-align: center;">
                  <a href="${portalLink}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Client Portal</a>
                </div>
                <p style="font-size: 0.9rem; color: #64748b;">You can use your Client Portal at any time to view your booking details, contracts, invoices, and deliverables.</p>
              ` : ''}
              <p>We look forward to seeing you soon!<br/><br/>Best regards,<br/><strong>${businessName}</strong></p>
            </div>
          `
        });

        // Also notify the business owner
        if (config.Admin_Email) {
          await transporter.sendMail({
            from: `"Clover CRM" <${config.Email_User}>`,
            to: config.Admin_Email,
            subject: `New Confirmed Booking — ${sessionName} on ${formattedDate}`,
            html: `
              <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #4da685;">New Confirmed Booking</h2>
                <table style="width:100%; border-collapse: collapse; margin: 1rem 0;">
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Client</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${clientName}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Email</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${clientEmail}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Phone</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${clientPhone || 'N/A'}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Session</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${sessionName}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Date</td><td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td></tr>
                  <tr><td style="padding: 0.5rem; font-weight: bold;">Time</td><td style="padding: 0.5rem;">${bookedTime}</td></tr>
                  ${notes ? `<tr><td style="padding: 0.5rem; font-weight: bold;">Notes</td><td style="padding: 0.5rem;">${notes}</td></tr>` : ''}
                </table>
                <p>This session booking was automatically approved. Log in to your dashboard to manage this booking.</p>
              </div>
            `
          });
        }
      } catch (emailErr) {
        console.error('Email send error (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ success: true, booking, inquiryId, portalLink });
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
          let updatePayload: any = { Status: 'Client' };
          // Do not override existing Package_ID on the contact level when booking multiple sessions
          await supabase.from('Contacts').update(updatePayload).eq('Contact_ID', contactId);
        } else {
          const { data: newContact, error: contactErr } = await supabase
            .from('Contacts')
            .insert({
              user_id: user.id,
              Name: booking.Client_Name,
              Email: booking.Client_Email,
              Phone: booking.Client_Phone || '',
              Lead_Source: 'Online Booking',
              Package_ID: booking.Package_ID || null,
              Status: 'Client'
            })
            .select()
            .single();

          if (!contactErr && newContact) contactId = newContact.Contact_ID;
        }

        if (contactId) {
          // Unconditionally create a new inquiry for this specific booking so multiple bookings aren't overridden
          const { data: newInquiry } = await supabase
            .from('Inquiries')
            .insert({
              user_id: user.id,
              Contact_ID: contactId,
              Service_Type: booking.Sessions?.Service_Type || 'Session',
              Event_Date: booking.Booked_Date,
              Pipeline_Stage: 'Booked',
              Estimated_Value: booking.Amount_Paid || 0
            })
            .select('Inquiry_ID')
            .single();

          if (newInquiry?.Inquiry_ID) {
            const inqId = newInquiry.Inquiry_ID;
            const today = new Date().toISOString().split('T')[0];

            if (booking.Contract_HTML) {
              await supabase.from('Contracts').insert({
                user_id: user.id,
                Inquiry_ID: inqId,
                Contract_Title: `${booking.Sessions?.Service_Type || 'Session'} Contract`,
                Contract_Text: booking.Contract_HTML,
                Status: 'Signed',
                Signed_Date: today,
                Client_Signature: booking.Signature || '',
                Type: 'Contract'
              });
            }

            const sessionName = booking.Sessions?.Service_Type || 'Session';
            const lineItems = [{ description: sessionName, amount: Number(booking.Amount_Paid) || 0, quantity: 1 }];
            await supabase.from('Invoices').insert({
              user_id: user.id,
              Inquiry_ID: inqId,
              Invoice_Title: `${sessionName} Invoice`,
              Total_Amount: Number(booking.Amount_Paid) || 0,
              Status: Number(booking.Amount_Paid) > 0 ? 'Paid' : 'Unpaid',
              Due_Date: today,
              Line_Items: JSON.stringify(lineItems)
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
