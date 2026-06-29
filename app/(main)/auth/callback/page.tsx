'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying security check...');
  const [errorOccurred, setErrorOccurred] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const stateStr = searchParams.get('state');
    const directAccessToken = searchParams.get('access_token');
    const directRefreshToken = searchParams.get('refresh_token');
    const directExpiresIn = searchParams.get('expires_in');

    if (!stateStr) {
      setStatus('Invalid request parameters. Callback missing state.');
      setErrorOccurred(true);
      return;
    }

    if (!code && !directAccessToken) {
      setStatus('Invalid request parameters. Callback missing authorization code or access token.');
      setErrorOccurred(true);
      return;
    }

    try {
      const { origin } = window.location;
      const redirectUri = `${origin}/auth/callback`;
      let parsedState: any = null;
      try {
        parsedState = JSON.parse(stateStr);
      } catch {
        parsedState = JSON.parse(decodeURIComponent(stateStr));
      }
      const { provider, isMobile, chatId, csrf, stateId, remoteUrl } = parsedState;

      // 1. Retrieve CSRF token from shared localStorage using collision-free key
      const savedCsrf = localStorage.getItem(`oauth_csrf_${provider}_${stateId}`);

      // 2. Immediate cleanup to prevent token replay attacks
      localStorage.removeItem(`oauth_csrf_${provider}_${stateId}`);

      if (!savedCsrf || savedCsrf !== csrf) {
        setStatus('Security validation failed: CSRF state token mismatch. Connection aborted.');
        setErrorOccurred(true);
        return;
      }

      setStatus(`Connecting to ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`);

      // 3. Save helper function
      const saveAndRedirect = async (accessToken: string, refreshToken?: string, expiresIn?: number) => {
        const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;
        const targetUrl = remoteUrl || `https://mcp.${provider}.com/mcp`;

        setStatus('Syncing tools and completing connection...');

        // Pre-fetch tools list to store in database cache (crucial for mobile/redirect flow)
        let cachedTools: any[] = [];
        try {
          const discRes = await fetch('/api/mcp/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: targetUrl,
              accessToken
            })
          });
          if (discRes.ok) {
            const discData = await discRes.json();
            if (discData.tools) {
              cachedTools = discData.tools.map((t: any) => ({
                name: t.name,
                namespacedName: t.name,
                description: t.description || 'No description provided.',
                inputSchema: t.inputSchema || {}
              }));
            }
          }
        } catch (syncErr) {
          console.warn('[Auth Callback] Background tool sync failed:', syncErr);
        }

        await db.mcpIntegrations.put({
          id: provider,
          name: provider.charAt(0).toUpperCase() + provider.slice(1),
          url: targetUrl,
          connectionMode: 'auto',
          authType: 'oauth',
          accessToken,
          refreshToken: refreshToken || undefined,
          expiresAt,
          isEnabled: true,
          status: 'connected',
          cachedTools,
          lastToolSync: Date.now(),
          createdAt: Date.now()
        });

        setStatus('Integration connected successfully!');

        if (isMobile) {
          setTimeout(() => {
            router.push('/');
          }, 800);
        } else {
          window.opener?.postMessage(
            { type: 'AUTH_SUCCESS', provider },
            window.location.origin
          );
          setTimeout(() => {
            window.close();
          }, 800);
        }
      };

      // 4. Handle direct tokens (Implicit Flow fallback)
      if (directAccessToken) {
        saveAndRedirect(
          directAccessToken, 
          directRefreshToken || undefined, 
          directExpiresIn ? parseInt(directExpiresIn) : undefined
        ).catch(err => {
          console.error(err);
          setStatus('Failed to save connection credentials.');
          setErrorOccurred(true);
        });
        return;
      }

      // 5. Swap code using PKCE if remote OAuth endpoint is set
      const codeVerifier = localStorage.getItem(`oauth_verifier_${provider}_${stateId}`);
      const clientId = localStorage.getItem(`oauth_client_${provider}_${stateId}`);
      const tokenEndpoint = localStorage.getItem(`oauth_token_endpoint_${provider}_${stateId}`);

      // Cleanup verifier state
      localStorage.removeItem(`oauth_verifier_${provider}_${stateId}`);
      localStorage.removeItem(`oauth_client_${provider}_${stateId}`);
      localStorage.removeItem(`oauth_token_endpoint_${provider}_${stateId}`);

      if (tokenEndpoint && codeVerifier) {
        // Direct remote MCP OAuth PKCE exchange
        const bodyParams = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code || '',
          redirect_uri: redirectUri,
          client_id: clientId || '',
          code_verifier: codeVerifier
        });

        fetch('/api/mcp/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'exchange-token',
            tokenEndpoint,
            bodyParams: Object.fromEntries(bodyParams)
          })
        })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(`Token exchange failed on remote server: ${errorText || res.status}`);
          }
          return res.json();
        })
        .then(async (data) => {
          // Adapt dynamic keys from remote response (e.g. access_token or accessToken)
          const accessToken = data.access_token || data.accessToken;
          const refreshToken = data.refresh_token || data.refreshToken;
          const expiresIn = data.expires_in || data.expiresIn;
          
          if (!accessToken) {
            throw new Error('No access_token returned by remote server.');
          }

          await saveAndRedirect(accessToken, refreshToken, expiresIn);
        })
        .catch((err) => {
          console.error(err);
          setStatus(err.message || 'Remote authentication exchange failed.');
          setErrorOccurred(true);
        });
      } else {
        // Fallback: Local Backend OAuth Exchange
        fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, provider })
        })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Token exchange failed.');
          }
          return res.json();
        })
        .then(async (data) => {
          await saveAndRedirect(data.accessToken, data.refreshToken, data.expiresIn);
        })
        .catch((err) => {
          console.error(err);
          setStatus(err.message || 'Authentication exchange failed. Please try again.');
          setErrorOccurred(true);
        });
      }
    } catch (e) {
      console.error(e);
      setStatus('Failed to parse callback state parameters.');
      setErrorOccurred(true);
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden p-6 select-none font-sans">
      {/* Sleek premium glowing background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {!errorOccurred ? (
          <div className="relative w-12 h-12 mb-6">
            <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-primary border-l-primary border-r-transparent border-b-transparent animate-spin" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6 font-bold text-lg">
            ✕
          </div>
        )}

        <h2 className="text-sm font-semibold tracking-wide text-foreground mb-1.5 uppercase">
          {errorOccurred ? 'Connection Error' : 'Authenticating'}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed transition-all">
          {status}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background text-xs text-muted-foreground">
        Loading context...
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
