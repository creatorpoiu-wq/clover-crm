import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// The sign page is PUBLIC — clients access it without a login session.
// We use the service role key to bypass RLS for reading/writing the contract.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

// GET /api/sign?token=xxx  — load contract for signing page
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const token = new URL(req.url).searchParams.get('token');
    if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });

    const { data: contract, error } = await supabase
      .from('Contracts')
      .select(`
        Contract_ID,
        Contract_Text,
        Contract_Title,
        Status,
        Sign_Token,
        Provider_Signature,
        Client_Signature,
        Signers,
        user_id,
        Inquiries!inner (
          Service_Type,
          Contacts!inner ( Name )
        )
      `)
      .eq('Sign_Token', token)
      .single();

    if (error || !contract) {
      return NextResponse.json({ success: false, error: 'Contract not found or link expired.' }, { status: 404 });
    }

    // Fetch the company name for the contract owner
    const { data: config } = await supabase
      .from('AppConfig')
      .select('Company_Name')
      .eq('user_id', contract.user_id)
      .single();

    const companyName = config?.Company_Name || 'Clover';

    const mappedContract = {
      ...contract,
      Contact_Name: (contract as any).Inquiries?.Contacts?.Name,
      Service_Type: (contract as any).Inquiries?.Service_Type,
    };

    if (contract.Status === 'Signed') {
      return NextResponse.json({ success: true, alreadySigned: true, contract: mappedContract, companyName });
    }

    return NextResponse.json({ success: true, contract: mappedContract, companyName });
  } catch (error: any) {
    console.error('Sign GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/sign — submit client signature
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { token, signatureDataUrl } = await req.json();
    if (!token || !signatureDataUrl) {
      return NextResponse.json({ success: false, error: 'Missing token or signature.' }, { status: 400 });
    }

    const { data: contract, error: findError } = await supabase
      .from('Contracts')
      .select('Contract_ID, Status')
      .eq('Sign_Token', token)
      .single();

    if (findError || !contract) {
      return NextResponse.json({ success: false, error: 'Invalid or expired signing link.' }, { status: 404 });
    }
    if (contract.Status === 'Signed') {
      return NextResponse.json({ success: false, error: 'Contract has already been signed.' }, { status: 409 });
    }

    const today = new Date().toISOString().split('T')[0];
    const { error: updateError } = await supabase
      .from('Contracts')
      .update({
        Status: 'Signed',
        Signed_Date: today,
        Client_Signature: signatureDataUrl
      })
      .eq('Contract_ID', contract.Contract_ID);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, signedDate: today });
  } catch (error: any) {
    console.error('Sign POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
