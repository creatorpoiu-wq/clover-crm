import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');

  if (!key) {
    return new NextResponse('Missing key', { status: 400 });
  }

  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      return new NextResponse('Not found', { status: 404 });
    }

    const contentType = response.ContentType || 'application/octet-stream';
    const body = response.Body as ReadableStream;

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('R2 proxy error:', err);
    if (err.name === 'NoSuchKey') {
      return new NextResponse('Not found', { status: 404 });
    }
    return new NextResponse('Error fetching media', { status: 500 });
  }
}
