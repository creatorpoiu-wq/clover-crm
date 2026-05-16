import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. All inquiries for pipeline value by stage + raw data
    const { data: allInquiries, error: inqError } = await supabase
      .from('Inquiries')
      .select(`
        Inquiry_ID,
        Pipeline_Stage,
        Estimated_Value,
        Service_Type,
        Event_Date,
        Contacts!inner ( Name, Email, Phone, Lead_Source )
      `)
      .order('Inquiry_ID', { ascending: false });

    if (inqError) throw inqError;

    // 1. Pipeline Value by Stage
    const stageMap: Record<string, { value: number; count: number }> = {};
    (allInquiries || []).forEach((inq: any) => {
      const stage = inq.Pipeline_Stage || 'Unknown';
      if (!stageMap[stage]) stageMap[stage] = { value: 0, count: 0 };
      stageMap[stage].value += inq.Estimated_Value || 0;
      stageMap[stage].count += 1;
    });
    const valueByStage = Object.entries(stageMap)
      .map(([label, { value, count }]) => ({ label, value, count }))
      .sort((a, b) => b.value - a.value);

    // 2. Source Breakdown
    const sourceMap: Record<string, number> = {};
    (allInquiries || []).forEach((inq: any) => {
      const src = inq.Contacts?.Lead_Source || 'Unknown';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const sourceBreakdown = Object.entries(sourceMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Service Breakdown
    const serviceMap: Record<string, number> = {};
    (allInquiries || []).forEach((inq: any) => {
      const svc = inq.Service_Type || 'Unknown';
      serviceMap[svc] = (serviceMap[svc] || 0) + 1;
    });
    const serviceBreakdown = Object.entries(serviceMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    // 4. Overall stats
    const total = (allInquiries || []).length;
    const booked = (allInquiries || []).filter((i: any) => i.Pipeline_Stage === 'Booked').length;
    const lost = (allInquiries || []).filter((i: any) => i.Pipeline_Stage === 'Lost/Archived').length;
    const totalValue = (allInquiries || []).reduce((sum: number, i: any) => sum + (i.Estimated_Value || 0), 0);
    const overallStats = { total, booked, lost, totalValue };

    // 5. Raw data for CSV export
    const rawData = (allInquiries || []).map((inq: any) => ({
      Inquiry_ID: inq.Inquiry_ID,
      Contact_Name: inq.Contacts?.Name,
      Email: inq.Contacts?.Email,
      Phone: inq.Contacts?.Phone,
      Lead_Source: inq.Contacts?.Lead_Source,
      Service_Type: inq.Service_Type,
      Event_Date: inq.Event_Date,
      Pipeline_Stage: inq.Pipeline_Stage,
      Estimated_Value: inq.Estimated_Value,
    }));

    // 6. Package Popularity — fetch packages and invoice items separately
    const { data: packages } = await supabase.from('Packages').select('Package_ID, Name');
    const { data: invoiceItems } = await supabase.from('Invoice_Items').select('Description');

    const packagePopularity = (packages || []).map((pkg: any) => {
      const count = (invoiceItems || []).filter((item: any) =>
        item.Description && item.Description.startsWith(pkg.Name)
      ).length;
      return { label: pkg.Name, count };
    }).sort((a: any, b: any) => b.count - a.count);

    return NextResponse.json({
      success: true,
      valueByStage,
      sourceBreakdown,
      serviceBreakdown,
      packagePopularity,
      overallStats,
      rawData
    });
  } catch (error: any) {
    console.error('Reports API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
