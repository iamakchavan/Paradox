import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { refreshToken, provider, tokenEndpoint, clientId: clientBodyId, clientSecret: clientBodySecret } = body;
    
    if (!refreshToken || !provider) {
      return NextResponse.json({ error: 'Refresh token and provider are required.' }, { status: 400 });
    }

    let tokenUrl = '';
    let requestOptions: RequestInit = {};

    // 1. If dynamic parameters are passed from client storage (custom SSE/OAuth), route directly
    if (tokenEndpoint) {
      tokenUrl = tokenEndpoint;
      const bodyParams = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientBodyId || 'paradox-local'
      });
      if (clientBodySecret) {
        bodyParams.append('client_secret', clientBodySecret);
      }
      requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString()
      };
    } else {
      // 2. Fall back to pre-configured environment credentials
      const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
      const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];

      if (!clientId || !clientSecret) {
        return NextResponse.json({ 
          error: `OAuth credentials for ${provider} are not configured on the server.` 
        }, { status: 400 });
      }

      switch (provider) {
      case 'github':
        tokenUrl = 'https://github.com/login/oauth/access_token';
        requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          })
        };
        break;

      case 'google':
      case 'cal':
        tokenUrl = provider === 'google' 
          ? 'https://oauth2.googleapis.com/token' 
          : 'https://cal.com/oauth/token';
          
        const bodyParams = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        });
        
        requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString()
        };
        break;

      default:
        return NextResponse.json({ 
          error: `Provider ${provider} does not support refreshing or is not configured.` 
        }, { status: 400 });
    }
    }

    const response = await fetch(tokenUrl, requestOptions);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }

    return NextResponse.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in || null
    });
  } catch (error: any) {
    console.error('[OAuth Refresh Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Token refresh failed.' }, { status: 500 });
  }
}
