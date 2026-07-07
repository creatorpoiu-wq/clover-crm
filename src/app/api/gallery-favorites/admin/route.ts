import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const galleryId = url.searchParams.get('galleryId');

    if (!galleryId) {
      return NextResponse.json({ success: false, error: 'Missing galleryId parameter' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Security check: ensure user owns the gallery
    const { data: gallery, error: galleryError } = await supabase
      .from('Galleries')
      .select('User_ID')
      .eq('Gallery_ID', galleryId)
      .single();

    if (galleryError || !gallery || gallery.User_ID !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized to access this gallery\'s proofing data' }, { status: 403 });
    }

    // Fetch all favorites with media metadata
    const { data: favorites, error: favsError } = await supabase
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
      .eq('Gallery_ID', galleryId)
      .order('Created_At', { ascending: false });

    if (favsError) throw favsError;

    // Group by Client_Email
    const grouped: Record<string, any[]> = {};
    (favorites || []).forEach((fav: any) => {
      const email = fav.Client_Email;
      if (!grouped[email]) {
        grouped[email] = [];
      }
      
      const mediaItem = Array.isArray(fav.Gallery_Media) ? fav.Gallery_Media[0] : fav.Gallery_Media;

      grouped[email].push({
        favoriteId: fav.Favorite_ID,
        mediaId: fav.Media_ID,
        createdAt: fav.Created_At,
        url: mediaItem?.Url || '',
        thumbnailUrl: mediaItem?.Thumbnail_Url || '',
        mediaType: mediaItem?.Media_Type || 'photo',
        fileName: mediaItem?.File_Name || `media-${fav.Media_ID}`
      });
    });

    return NextResponse.json({ success: true, data: grouped });
  } catch (err: any) {
    console.error('Error fetching admin favorites:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
