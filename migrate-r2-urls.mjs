import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://clover-crm.vercel.app';

// Pattern: old R2 storage URLs that point directly to r2.cloudflarestorage.com or r2.dev
// We extract the key and rewrite to /api/r2?key=...
function extractKey(url) {
  // Match: https://{anything}.r2.cloudflarestorage.com/{bucket}/{key...}
  // OR: https://pub-{anything}.r2.dev/{key...}
  const patterns = [
    /https?:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)/,  // private endpoint
    /https?:\/\/pub-[^/]+\.r2\.dev\/(.+)/,                         // public r2.dev endpoint
    /https?:\/\/[^/]+\.r2\.dev\/(.+)/,                             // other r2.dev
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function migrate() {
  const { data: media, error } = await supabase
    .from('Gallery_Media')
    .select('Media_ID, Url, Thumbnail_Url');

  if (error) {
    console.error('Error fetching media:', error);
    return;
  }

  console.log(`Found ${media.length} media records`);
  let updated = 0;
  let skipped = 0;

  for (const item of media) {
    const updates = {};

    for (const field of ['Url', 'Thumbnail_Url']) {
      const oldUrl = item[field];
      if (!oldUrl) continue;
      
      // Already using proxy URL - skip
      if (oldUrl.includes('/api/r2?key=')) {
        continue;
      }

      const key = extractKey(oldUrl);
      if (key) {
        updates[field] = `${BASE_URL}/api/r2?key=${encodeURIComponent(key)}`;
        console.log(`  ${field}: ${oldUrl.slice(0, 60)}... → /api/r2?key=${key.slice(0, 40)}...`);
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('Gallery_Media')
        .update(updates)
        .eq('Media_ID', item.Media_ID);
      
      if (updateError) {
        console.error(`  ❌ Failed to update Media_ID ${item.Media_ID}:`, updateError.message);
      } else {
        updated++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done — updated: ${updated}, skipped (already OK or non-R2): ${skipped}`);
}

migrate();
