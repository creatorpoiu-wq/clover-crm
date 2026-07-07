import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: Returns list of Media_ID's favorited by Client_Email
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const galleryId = url.searchParams.get('galleryId');
    const email = url.searchParams.get('email');

    if (!galleryId || !email) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: favorites, error } = await supabase
      .from('Gallery_Favorites')
      .select('Media_ID')
      .eq('Gallery_ID', galleryId)
      .eq('Client_Email', email.toLowerCase().trim());

    if (error) throw error;

    const mediaIds = favorites.map(f => f.Media_ID);

    return NextResponse.json({ success: true, data: mediaIds });
  } catch (err: any) {
    console.error('Error fetching favorites:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Toggles favorite state (Like/Unlike)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { galleryId, mediaId, email } = body;

    if (!galleryId || !mediaId || !email) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const cleanEmail = email.toLowerCase().trim();

    // Check if favorite already exists
    const { data: existing, error: findError } = await supabase
      .from('Gallery_Favorites')
      .select('Favorite_ID')
      .eq('Gallery_ID', galleryId)
      .eq('Media_ID', mediaId)
      .eq('Client_Email', cleanEmail)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      // Remove favorite (Unlike)
      const { error: deleteError } = await supabase
        .from('Gallery_Favorites')
        .delete()
        .eq('Favorite_ID', existing.Favorite_ID);

      if (deleteError) throw deleteError;

      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add favorite (Like)
      const { error: insertError } = await supabase
        .from('Gallery_Favorites')
        .insert({
          Gallery_ID: galleryId,
          Media_ID: mediaId,
          Client_Email: cleanEmail
        });

      if (insertError) throw insertError;

      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (err: any) {
    console.error('Error toggling favorite:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
