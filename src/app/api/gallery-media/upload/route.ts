import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 is not fully configured on the server (missing account ID, access key, or secret key).');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { galleryId, albumId, filename, contentType } = body;

    if (!galleryId || !filename || !contentType) {
      return NextResponse.json({ success: false, error: 'Missing required parameters (galleryId, filename, contentType)' }, { status: 400 });
    }

    // Security check: ensure user owns the gallery
    const { data: gallery, error: galleryError } = await supabase
      .from('Galleries')
      .select('User_ID')
      .eq('Gallery_ID', galleryId)
      .single();

    if (galleryError || !gallery || gallery.User_ID !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized to modify this gallery' }, { status: 403 });
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME environment variable is not defined.');
    }

    const r3Client = getR2Client();

    // Sanitize original filename: strip path separators, collapse spaces/special chars to underscores
    const sanitizedName = filename
      .replace(/[/\\]/g, '')               // strip slashes
      .replace(/[^a-zA-Z0-9._-]/g, '_')   // replace unsafe chars with underscores
      .replace(/__+/g, '_');               // collapse multiple underscores

    // Build key: keep original name but prefix with a timestamp to avoid collisions
    const uniqueId = Date.now();
    const key = `galleries/${galleryId}/${albumId || 'root'}/${uniqueId}_${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned PUT URL valid for 1 hour (3600 seconds)
    const uploadUrl = await getSignedUrl(r3Client, command, { expiresIn: 3600 });

    const publicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
    const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${key}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
      originalFilename: sanitizedName,
    });
  } catch (err: any) {
    console.error('R2 upload endpoint error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
