import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing target url parameter' }), { status: 400 });
    }

    // Validate URL safety
    try {
      new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid url format' }), { status: 400 });
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch external image' }), { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400' // Cache favicons for 1 day
      }
    });
  } catch (error: any) {
    console.error('Error proxying image:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
