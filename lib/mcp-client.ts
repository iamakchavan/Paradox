import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { db } from '@/lib/db';
import { discoverOAuthMetadata } from './mcp-oauth';

/**
 * Executes a tool directly from the browser to a remote MCP server over SSE.
 * Requires the MCP server to support CORS.
 */
export async function executeDirectTool(
  url: string,
  toolName: string,
  args: any,
  accessToken?: string
): Promise<any> {
  const transport = new SSEClientTransport(new URL(url), {
    eventSourceInit: accessToken ? {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    } as any : undefined
  });

  const client = new Client(
    { name: 'paradox-client', version: '1.0.0' },
    { capabilities: {} }
  );

  const runToolCall = async () => {
    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: toolName,
        arguments: args
      });
      return result;
    } finally {
      try {
        await client.close();
      } catch (e) {
        console.warn('[MCP Client Close Error]:', e);
      }
    }
  };

  return Promise.race([
    runToolCall(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Browser direct tool execution timeout (CORS block or server offline).')), 4000)
    )
  ]);
}

/**
 * Performs a client-side preflight check to refresh any expired or expiring OAuth integration access tokens.
 * Keeps token refresh cycles out of the generation path to avoid user response stuttering.
 */
export async function preflightRefreshIntegrations(): Promise<void> {
  try {
    const integrations = await db.mcpIntegrations.toArray();
    const activeOAuth = integrations.filter(
      (s) => s.isEnabled && s.authType === 'oauth' && s.refreshToken
    );

    const FIVE_MINUTES = 5 * 60 * 1000;
    const now = Date.now();

    for (const app of activeOAuth) {
      const needsRefresh = app.expiresAt && (app.expiresAt - now < FIVE_MINUTES);
      if (needsRefresh) {
        console.log(`[OAuth Preflight] Refreshing token for provider: ${app.id}`);
        try {
          let refreshedData = null;

          // 1. Attempt direct client-side refresh using dynamically registered browser client ID
          try {
            const metadata = await discoverOAuthMetadata(app.url);
            const tokenEndpoint = metadata?.token_endpoint;
            const clientId = localStorage.getItem(`mcp_oauth_client_${app.id}`) || 'paradox-local';

            if (tokenEndpoint) {
              const bodyParams = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: app.refreshToken || '',
                client_id: clientId
              });

              const directRes = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: bodyParams.toString()
              });

              if (directRes.ok) {
                refreshedData = await directRes.json();
                console.log(`[OAuth Preflight] Direct browser token refresh succeeded for provider: ${app.id}`);
              }
            }
          } catch (directErr) {
            console.warn(`[OAuth Preflight] Direct client-side refresh failed for ${app.id}, falling back to server:`, directErr);
          }

          // 2. Fallback to server-side refresh endpoint if browser-direct attempt failed
          if (!refreshedData) {
            const res = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                refreshToken: app.refreshToken,
                provider: app.id
              })
            });

            if (!res.ok) {
              throw new Error(`Server refresh request failed with status: ${res.status}`);
            }

            refreshedData = await res.json();
            console.log(`[OAuth Preflight] Server-side fallback token refresh succeeded for provider: ${app.id}`);
          }

          const expiresAt = refreshedData.expiresIn ? Date.now() + refreshedData.expiresIn * 1000 : undefined;

          await db.mcpIntegrations.update(app.id, {
            accessToken: refreshedData.accessToken,
            refreshToken: refreshedData.refreshToken || app.refreshToken,
            expiresAt,
            status: 'connected'
          });
        } catch (e: any) {
          console.warn(`[OAuth Preflight] Failed to refresh token for ${app.id}:`, e);
          await db.mcpIntegrations.update(app.id, { status: 'expired' });
        }
      }
    }
  } catch (err) {
    console.error('[OAuth Preflight Error]:', err);
  }
}

/**
 * Discovers tools directly from the browser to a remote MCP server over SSE.
 * Requires the MCP server to support CORS.
 */
export async function discoverDirectTools(
  url: string,
  accessToken?: string
): Promise<any[]> {
  const transport = new SSEClientTransport(new URL(url), {
    eventSourceInit: accessToken ? {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    } as any : undefined
  });

  const client = new Client(
    { name: 'paradox-client', version: '1.0.0' },
    { capabilities: {} }
  );

  const connectAndList = async () => {
    try {
      await client.connect(transport);
      const result = await client.listTools();
      return result.tools || [];
    } finally {
      try {
        await client.close();
      } catch (e) {
        console.warn('[MCP Client Close Error]:', e);
      }
    }
  };

  return Promise.race([
    connectAndList(),
    new Promise<any[]>((_, reject) =>
      setTimeout(() => reject(new Error('Browser direct connection timeout (CORS block or server offline).')), 3500)
    )
  ]);
}

