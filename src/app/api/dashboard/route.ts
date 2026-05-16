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
      .select('Pipeline_Stage');

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

    return NextResponse.json({
      success: true,
      activeCount,
      totalValue,
      activeRemindersCount: activeRemindersCount || 0,
      stageCounts
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
