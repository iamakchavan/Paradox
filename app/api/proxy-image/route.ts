import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing target url parameter' }), { status: 400 });
    }

    // Validate URL safety
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid url format' }), { status: 400 });
    }

    if (parsedUrl.protocol !== 'https:') {
      return new Response(JSON.stringify({ error: 'Only HTTPS URLs are allowed' }), { status: 400 });
    }

    if (parsedUrl.hostname !== 'www.google.com') {
      return new Response(JSON.stringify({ error: 'Access to target URL host is restricted' }), { status: 400 });
    }

    if (!parsedUrl.pathname.startsWith('/s2/favicons')) {
      return new Response(JSON.stringify({ error: 'Access to target URL path is restricted' }), { status: 400 });
    }

    let response = await fetch(targetUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // Handle Google's favicon redirects to *.gstatic.com CDN safely
    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
      const redirectUrlStr = response.headers.get('location');
      if (!redirectUrlStr) {
        return new Response(JSON.stringify({ error: 'Redirect location missing' }), { status: 400 });
      }

      let redirectUrl: URL;
      try {
        redirectUrl = new URL(redirectUrlStr, targetUrl);
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid redirect URL format' }), { status: 400 });
      }

      if (redirectUrl.protocol !== 'https:') {
        return new Response(JSON.stringify({ error: 'Only HTTPS redirect URLs are allowed' }), { status: 400 });
      }

      const allowedHosts = ['www.google.com', 'gstatic.com'];
      const isAllowedHost = allowedHosts.includes(redirectUrl.hostname) || redirectUrl.hostname.endsWith('.gstatic.com');

      if (!isAllowedHost) {
        return new Response(JSON.stringify({ error: 'Access to redirect target host is restricted' }), { status: 400 });
      }

      response = await fetch(redirectUrl.toString(), {
        redirect: 'error',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    }

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch external image' }), { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Resource fetched is not an image' }), { status: 400 });
    }

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
