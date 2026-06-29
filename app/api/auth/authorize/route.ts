import { NextResponse } from 'next/server';

const PROVIDER_AUTH_URLS: Record<string, string> = {
  github: 'https://github.com/login/oauth/authorize',
  notion: 'https://api.notion.com/v1/oauth/authorize',
  cal: 'https://app.cal.com/auth/oauth2/authorize'
};

const PROVIDER_SCOPES: Record<string, string> = {
  github: 'repo', // Request repository access scope to search/manage code files
  notion: '',     // Notion permissions are selected directly by the user on their portal
  cal: 'EVENT_TYPE_READ EVENT_TYPE_WRITE BOOKING_READ BOOKING_WRITE SCHEDULE_READ SCHEDULE_WRITE APPS_READ APPS_WRITE PROFILE_READ PROFILE_WRITE ORG_BOOKING_READ TEAM_BOOKING_READ ORG_MEMBERSHIP_READ ORG_MEMBERSHIP_WRITE ORG_ROUTING_FORM_READ'
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');
    const isMobile = searchParams.get('isMobile') === 'true';
    const chatId = searchParams.get('chatId') || '';
    const csrf = searchParams.get('csrf') || '';
    const stateId = searchParams.get('stateId') || '';
    const remoteUrl = searchParams.get('remoteUrl');

    if (!provider || !PROVIDER_AUTH_URLS[provider]) {
      return new NextResponse('Invalid provider', { status: 400 });
    }

    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    if (!clientId) {
      return new NextResponse(`OAuth Client ID for ${provider} is not configured on the server. Please set it in your environment.`, { status: 500 });
    }

    const { origin } = new URL(req.url);
    const redirectUri = `${origin}/auth/callback`;
    const state = JSON.stringify({ provider, isMobile, chatId, csrf, stateId, remoteUrl });
    const scope = PROVIDER_SCOPES[provider];
    
    let authUrl = `${PROVIDER_AUTH_URLS[provider]}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&response_type=code`;
    
    if (scope) {
      authUrl += `&scope=${encodeURIComponent(scope)}`;
    }

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('[OAuth Authorize Route Error]:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
