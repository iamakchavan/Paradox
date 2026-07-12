'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';

function isSafeUrl(urlStr: string): boolean {
  // In development mode, allow local/private endpoints for developer convenience
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    const parsed = new URL(urlStr);
    
    if (parsed.protocol !== 'https:') {
      return false;
    }
    
    const host = parsed.hostname.toLowerCase();
    
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host === 'metadata.google.internal' ||
      host === 'metadata'
    ) {
      return false;
    }
    
    const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipPattern);
    if (match) {
      const [, octet1, octet2] = match.map(Number);
      if (octet1 === 10) return false;
      if (octet1 === 192 && octet2 === 168) return false;
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false;
      if (octet1 === 169 && octet2 === 254) return false;
      if (octet1 === 127) return false;
      if (octet1 === 0 || octet1 >= 224) return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying security check...');
  const [errorOccurred, setErrorOccurred] = useState(false);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    const code = searchParams.get('code');
    const stateStr = searchParams.get('state');

    if (!stateStr) {
      setStatus('Invalid request parameters. Callback missing state.');
      setErrorOccurred(true);
      return;
    }

    if (!code) {
      setStatus('Invalid request parameters. Callback missing authorization code.');
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

      // 1. Retrieve CSRF token from shared sessionStorage using static key
      const savedCsrf = sessionStorage.getItem('oauth_pending_csrf');

      // 2. Immediate cleanup to prevent token replay attacks
      sessionStorage.removeItem('oauth_pending_csrf');

      if (!savedCsrf || savedCsrf !== csrf) {
        setStatus('Security validation failed: CSRF state token mismatch. Connection aborted.');
        setErrorOccurred(true);
        return;
      }

      setStatus(`Connecting to ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`);

      // 3. Save helper function
      const saveAndRedirect = async (accessToken: string, refreshToken?: string, expiresIn?: number) => {
        const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;
        const defaultUrl = `https://mcp.${provider}.com/mcp`;
        const targetUrl = (remoteUrl && isSafeUrl(remoteUrl)) ? remoteUrl : defaultUrl;

        setStatus('Syncing tools and completing connection...');

        // Pre-fetch tools list to store in database cache (crucial for mobile/redirect flow)
        // Namespace tools with provider id so they collide-free in Skills / chat tools.
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
              const prefix = `${String(provider).toLowerCase()}_`;
              cachedTools = discData.tools.map((t: any) => {
                const cleanName = String(t.name || '').replace(/:/g, '_');
                const namespacedName = cleanName.startsWith(prefix)
                  ? cleanName
                  : `${prefix}${cleanName}`;
                return {
                  name: namespacedName,
                  namespacedName,
                  description: t.description || 'No description provided.',
                  inputSchema: t.inputSchema || {}
                };
              });
            }
          }
        } catch (syncErr) {
          console.warn('[Auth Callback] Background tool sync failed:', syncErr);
        }

        const existing = await db.mcpIntegrations.get(provider);
        const displayName =
          existing?.name ||
          (provider.charAt(0).toUpperCase() + provider.slice(1));

        await db.mcpIntegrations.put({
          id: provider,
          name: displayName,
          url: targetUrl,
          connectionMode: existing?.connectionMode || 'auto',
          authType: 'oauth',
          accessToken,
          refreshToken: refreshToken || undefined,
          expiresAt,
          scope: authorizedScope || existing?.scope || undefined,
          isEnabled: true,
          status: 'connected',
          cachedTools,
          lastToolSync: Date.now(),
          createdAt: existing?.createdAt || Date.now()
        });

        setStatus(
          cachedTools.length > 0
            ? `Connected — ${cachedTools.length} tools detected.`
            : 'Integration connected successfully!'
        );

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

      // 4. Swap code using PKCE if remote OAuth endpoint is set
      const codeVerifier = sessionStorage.getItem('oauth_pending_verifier');
      const clientId = sessionStorage.getItem('oauth_pending_client');
      const clientSecret = sessionStorage.getItem('oauth_pending_secret');
      const authorizedScope = sessionStorage.getItem('oauth_pending_scope');
      const tokenEndpoint = sessionStorage.getItem('oauth_pending_token_endpoint');

      // Cleanup verifier state
      sessionStorage.removeItem('oauth_pending_verifier');
      sessionStorage.removeItem('oauth_pending_client');
      sessionStorage.removeItem('oauth_pending_secret');
      sessionStorage.removeItem('oauth_pending_scope');
      sessionStorage.removeItem('oauth_pending_token_endpoint');

      if (tokenEndpoint && codeVerifier) {
        // Direct remote MCP OAuth PKCE exchange
        const bodyParams = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code || '',
          redirect_uri: redirectUri,
          client_id: clientId || '',
          code_verifier: codeVerifier
        });
        if (clientSecret) {
          bodyParams.append('client_secret', clientSecret);
        }

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
