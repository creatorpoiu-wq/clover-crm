import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rid = searchParams.get('rid');

  if (rid) {
    try {
      const supabase = getServiceClient();

      // Check if recipient exists and hasn't been marked as opened yet
      const { data: recipient } = await supabase
        .from('Marketing_Campaign_Recipients')
        .select('id, campaign_id, opened_at')
        .eq('id', rid)
        .single();

      if (recipient && !recipient.opened_at) {
        // Mark as opened
        const now = new Date().toISOString();
        await supabase
          .from('Marketing_Campaign_Recipients')
          .update({ opened_at: now, status: 'Opened' })
          .eq('id', rid);

        // Increment campaign open count (we can use an RPC for atomic increment, but this is fine for MVP)
        // A better way is fetching the current count and adding 1, but for high concurrency, use RPC.
        // I will use a simple read-modify-write for now.
        const { data: campaign } = await supabase
          .from('Marketing_Campaigns')
          .select('open_count')
          .eq('id', recipient.campaign_id)
          .single();

        if (campaign) {
          await supabase
            .from('Marketing_Campaigns')
            .update({ open_count: (campaign.open_count || 0) + 1 })
            .eq('id', recipient.campaign_id);
        }
      }
    } catch (error) {
      console.error('Email tracking error:', error);
      // Ignore errors so the image still loads
    }
  }

  // Always return the transparent GIF
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
