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
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ success: false, error: 'Missing required parameters (filename, contentType)' }, { status: 400 });
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME environment variable is not defined.');
    }

    const r3Client = getR2Client();

    // Sanitize original filename
    const sanitizedName = filename
      .replace(/[/\\]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/__+/g, '_');

    // Build key
    const uniqueId = Date.now();
    const key = `store/${user.id}/${uniqueId}_${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r3Client, command, { expiresIn: 3600 });
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
    const publicUrl = `${baseUrl}/api/r2?key=${encodeURIComponent(key)}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
      originalFilename: sanitizedName,
    });
  } catch (err: any) {
    console.error('R2 store upload endpoint error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
