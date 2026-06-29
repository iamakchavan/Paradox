import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code, provider } = await req.json();
    
    if (!code || !provider) {
      return NextResponse.json({ error: 'Code and provider are required.' }, { status: 400 });
    }

    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    const { origin } = new URL(req.url);
    const redirectUri = `${origin}/auth/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: `OAuth credentials for ${provider} are not configured on the server.` 
      }, { status: 500 });
    }

    let tokenUrl = '';
    let requestOptions: RequestInit = {};

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
            code,
            redirect_uri: redirectUri
          })
        };
        break;

      case 'notion':
        tokenUrl = 'https://api.notion.com/v1/oauth/token';
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        requestOptions = {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri
          })
        };
        break;

      case 'google':
      case 'cal':
        tokenUrl = provider === 'google' 
          ? 'https://oauth2.googleapis.com/token' 
          : 'https://api.cal.com/v2/auth/oauth2/token';
          
        const bodyParams = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        });
        
        requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString()
        };
        break;

      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const response = await fetch(tokenUrl, requestOptions);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }

    return NextResponse.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresIn: data.expires_in || null
    });
  } catch (error: any) {
    console.error('[OAuth Exchange Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Token exchange failed.' }, { status: 500 });
  }
}
