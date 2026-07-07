import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('Gallery_Favorites')
    .select(`
      Favorite_ID,
      Client_Email,
      Created_At,
      Media_ID,
      Gallery_Media:Media_ID (
        Url,
        Thumbnail_Url,
        Media_Type,
        File_Name
      )
    `)
    .limit(5);

  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

test();
