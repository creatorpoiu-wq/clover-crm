import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: activeInquiries, error: inqError } = await supabase
      .from('Inquiries')
      .select('Pipeline_Stage, Estimated_Value')
      .neq('Pipeline_Stage', 'Lost/Archived');
      
    if (inqError) throw inqError;

    // Stage counts - we calculate this manually from activeInquiries plus lost/archived if we want them,
    // but the original query did it for ALL inquiries. So let's fetch all stages.
    const { data: allInquiries, error: allInqError } = await supabase
      .from('Inquiries')
      .select('Pipeline_Stage, Event_Date, Estimated_Value');

    if (allInqError) throw allInqError;

    const stageCountsMap: Record<string, number> = {};
    (allInquiries || []).forEach(inq => {
      const stage = inq.Pipeline_Stage || 'Unknown';
      stageCountsMap[stage] = (stageCountsMap[stage] || 0) + 1;
    });
    
    const stageCounts = Object.keys(stageCountsMap).map(stage => ({
      stage,
      count: stageCountsMap[stage]
    }));

    const { count: activeRemindersCount, error: remError } = await supabase
      .from('Reminders')
      .select('*', { count: 'exact', head: true })
      .eq('Is_Completed', 0);

    if (remError) throw remError;

    const activeCount = (activeInquiries || []).length;
    const totalValue = (activeInquiries || []).reduce((sum: number, item: any) => sum + (item.Estimated_Value || 0), 0);

    const now = new Date();
    let minDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    let maxDate = new Date(now.getFullYear(), now.getMonth(), 1);

    (allInquiries || []).forEach(inq => {
      if (inq.Event_Date) {
        const d = new Date(inq.Event_Date);
        const dMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        if (dMonth < minDate) minDate = dMonth;
        if (dMonth > maxDate) maxDate = dMonth;
      }
    });

    const monthlyData: any[] = [];
    const curr = new Date(minDate);
    while (curr <= maxDate) {
      monthlyData.push({
        month: curr.toLocaleString('default', { month: 'short' }),
        year: curr.getFullYear(),
        revenue: 0,
        leads: 0,
        monthIndex: curr.getMonth()
      });
      curr.setMonth(curr.getMonth() + 1);
    }

    (allInquiries || []).forEach(inq => {
      if (inq.Event_Date) {
        const ed = new Date(inq.Event_Date);
        const match = monthlyData.find(m => m.monthIndex === ed.getMonth() && m.year === ed.getFullYear());
        if (match) {
           match.revenue += (inq.Estimated_Value || 0);
           match.leads += 1;
        }
      }
    });

    return NextResponse.json({
      success: true,
      activeCount,
      totalValue,
      activeRemindersCount: activeRemindersCount || 0,
      stageCounts,
      monthlyData
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
