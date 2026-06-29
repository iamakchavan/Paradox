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
      let origin = '';
      try {
        origin = new URL(url).origin;
      } catch (e) {
        console.warn('[OAuth Discovery API] Could not parse origin for URL:', url);
      }

      const base = url.replace(/\/mcp$/, '').replace(/\/sse$/, '').replace(/\/$/, '');

      // 1. Direct oauth-protected-resource checks (RFC 8414 standard)
      const prmUrls: string[] = [];
      if (origin) {
        prmUrls.push(`${origin}/.well-known/oauth-protected-resource`);
      }
      prmUrls.push(`${base}/.well-known/oauth-protected-resource`);
      prmUrls.push(`${url}/.well-known/oauth-protected-resource`);

      let prmUrl = '';
      for (const checkUrl of prmUrls) {
        try {
          const res = await fetch(checkUrl, { signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            const data = await res.json();
            if (data.authorization_servers || (data.authorization_endpoint && data.token_endpoint)) {
              prmUrl = checkUrl;
              break;
            }
          }
        } catch (e) {
          // Continue to next check
        }
      }

      // 2. Fallback probe: Check WWW-Authenticate header for resource_metadata
      if (!prmUrl) {
        try {
          const probePost = await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/event-stream'
            },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', params: {}, id: 1 }),
            signal: AbortSignal.timeout(10000)
          });
          
          let authHeader = '';
          probePost.headers.forEach((val, key) => {
            if (key.toLowerCase() === 'www-authenticate') {
              authHeader = val;
            }
          });

          if (authHeader) {
            const match = authHeader.match(/resource_metadata="([^"]+)"/) || authHeader.match(/resource_metadata=([^,\s]+)/);
            if (match && match[1]) {
              prmUrl = match[1];
            }
          }
        } catch (e) {
          console.warn('[OAuth Discovery API] POST probe failed:', e);
        }
      }

      if (!prmUrl) {
        try {
          const probeGet = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json, text/event-stream' },
            signal: AbortSignal.timeout(10000)
          });
          
          let authHeader = '';
          probeGet.headers.forEach((val, key) => {
            if (key.toLowerCase() === 'www-authenticate') {
              authHeader = val;
            }
          });

          if (authHeader) {
            const match = authHeader.match(/resource_metadata="([^"]+)"/) || authHeader.match(/resource_metadata=([^,\s]+)/);
            if (match && match[1]) {
              prmUrl = match[1];
            }
          }
        } catch (e) {
          console.warn('[OAuth Discovery API] GET probe failed:', e);
        }
      }

      if (prmUrl) {
        try {
          const res = await fetch(prmUrl, { signal: AbortSignal.timeout(10000) });
          if (res.ok) {
            const data = await res.json();
            
            // A. Direct endpoint payload
            if (data.authorization_endpoint && data.token_endpoint) {
              return NextResponse.json({
                authorization_endpoint: data.authorization_endpoint,
                token_endpoint: data.token_endpoint,
                registration_endpoint: data.registration_endpoint
              });
            }

            // B. Indirect authorization server lookup (RFC 8414 standard)
            if (data.authorization_servers && Array.isArray(data.authorization_servers) && data.authorization_servers.length > 0) {
              const authServer = data.authorization_servers[0].replace(/\/$/, '');
              const authServerMetadataUrls = [
                `${authServer}/.well-known/oauth-authorization-server`,
                `${authServer}/.well-known/openid-configuration`
              ];

              for (const asUrl of authServerMetadataUrls) {
                try {
                  const asRes = await fetch(asUrl, { signal: AbortSignal.timeout(10000) });
                  if (asRes.ok) {
                    const asData = await asRes.json();
                    if (asData.authorization_endpoint && asData.token_endpoint) {
                      return NextResponse.json({
                        authorization_endpoint: asData.authorization_endpoint,
                        token_endpoint: asData.token_endpoint,
                        registration_endpoint: asData.registration_endpoint
                      });
                    }
                  }
                } catch (asErr) {
                  console.warn(`[OAuth Discovery API] Failed to fetch from auth server metadata: ${asUrl}`, asErr);
                }
              }
            }
          }
        } catch (e) {
          console.warn('[OAuth Discovery API] Failed to fetch resource_metadata from WWW-Authenticate header:', prmUrl, e);
        }
      }

      const discoveryUrls: string[] = [];
      
      if (origin) {
        discoveryUrls.push(`${origin}/.well-known/oauth-authorization-server`);
        discoveryUrls.push(`${origin}/.well-known/openid-configuration`);
      }
      
      discoveryUrls.push(`${base}/.well-known/oauth-authorization-server`);
      discoveryUrls.push(`${base}/.well-known/openid-configuration`);
      discoveryUrls.push(`${url}/.well-known/oauth-authorization-server`);

      for (const dUrl of discoveryUrls) {
        try {
          const res = await fetch(dUrl, { signal: AbortSignal.timeout(10000) });
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

    // 3. Perform Token Exchange Proxy (Bypasses Browser CORS limits)
    if (action === 'exchange-token') {
      const { tokenEndpoint, bodyParams } = body;
      if (!tokenEndpoint) {
        return NextResponse.json({ error: 'tokenEndpoint is required' }, { status: 400 });
      }

      const res = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(bodyParams).toString(),
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        return NextResponse.json({ error: `Token exchange failed: ${errorText || res.status}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    // 4. Connect to the remote MCP Server over HTTP/SSE (Default Flow)
    if (!url) {
      return NextResponse.json({ error: 'Server URL is required' }, { status: 400 });
    }

    const transportType = url.includes('/sse') ? 'sse' : 'http';
    const mcpClient = await createMCPClient({
      transport: {
        type: transportType as 'sse' | 'http',
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
