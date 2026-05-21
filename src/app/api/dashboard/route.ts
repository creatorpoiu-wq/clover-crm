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
    const monthlyData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        revenue: 0,
        leads: 0,
        monthIndex: d.getMonth()
      };
    }).reverse();

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
