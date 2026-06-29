import { NextResponse } from 'next/server';
import { createMCPClient } from '@ai-sdk/mcp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, url, accessToken } = body;

    // 1. Discover OAuth Metadata from remote server
    if (action === 'discover-oauth') {
      if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }
      const base = url.replace(/\/mcp$/, '');
      const discoveryUrls = [
        `${base}/.well-known/oauth-authorization-server`,
        `${url}/.well-known/oauth-authorization-server`
      ];

      for (const dUrl of discoveryUrls) {
        try {
          const res = await fetch(dUrl, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const data = await res.json();
            if (data.authorization_endpoint && data.token_endpoint) {
              return NextResponse.json({
                authorization_endpoint: data.authorization_endpoint,
                token_endpoint: data.token_endpoint,
                registration_endpoint: data.registration_endpoint
              });
            }
          }
        } catch (e) {
          console.warn(`[OAuth Discovery Proxy] Failed to fetch from: ${dUrl}`, e);
        }
      }
      return NextResponse.json({ error: 'Could not discover OAuth endpoints on this remote MCP server.' }, { status: 502 });
    }

    // 2. Perform Dynamic Client Registration
    if (action === 'register-oauth') {
      const { registrationUrl, redirectUri, scope } = body;
      if (!registrationUrl || !redirectUri) {
        return NextResponse.json({ error: 'registrationUrl and redirectUri are required' }, { status: 400 });
      }

      const res = await fetch(registrationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'Paradox Local',
          redirect_uris: [redirectUri],
          grant_types: ['authorization_code'],
          response_types: ['code'],
          token_endpoint_auth_method: 'none',
          scope: scope || undefined
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        return NextResponse.json({ error: `Registration server returned status: ${res.status}` }, { status: 502 });
      }

      const data = await res.json();
      return NextResponse.json({ client_id: data.client_id });
    }

    // 3. Connect to the remote MCP Server over HTTP/SSE (Default Flow)
    if (!url) {
      return NextResponse.json({ error: 'Server URL is required' }, { status: 400 });
    }

    const mcpClient = await createMCPClient({
      transport: {
        type: 'http',
        url,
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
      }
    });

    const tools = await mcpClient.tools();

    // Map tools to a serializable format to return to the client browser
    const formattedTools = Object.entries(tools).map(([name, config]: [string, any]) => ({
      name,
      description: config.description || '',
      inputSchema: config.inputSchema || {}
    }));

    return NextResponse.json({ tools: formattedTools });
  } catch (error: any) {
    console.error('[MCP Discover Route Error]:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to discover tools from the MCP server.' 
    }, { status: 500 });
  }
}
