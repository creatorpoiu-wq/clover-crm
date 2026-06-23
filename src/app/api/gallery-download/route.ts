import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Extract a reasonable filename
    let filename = 'download';
    try {
      const parsedUrl = new URL(targetUrl);
      const parts = parsedUrl.pathname.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        filename = lastPart;
      } else {
        filename = `download-${Date.now()}.jpg`; // fallback
      }
    } catch(e) {
      // ignore parsing errors
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(blob, { status: 200, headers });
  } catch (err: any) {
    console.error('Download proxy error:', err);
    return new NextResponse('Failed to proxy download', { status: 500 });
  }
}
