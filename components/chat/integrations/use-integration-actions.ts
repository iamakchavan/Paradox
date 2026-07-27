"use client";

import { useState } from 'react';
import { db } from '@/lib/db';
import { discoverDirectTools, preflightRefreshIntegrations } from '@/lib/mcp-client';
import { useCustomToast } from '@/components/ui/custom-toast';
import {
  discoverOAuthMetadata,
  registerMcpClient,
  generateCodeVerifier,
  generateCodeChallenge,
  resolveSupportedOAuthScope,
} from '@/lib/mcp-oauth';
import { PROVIDER_SCOPES, PROVIDER_TEMPLATES } from './provider-catalog';

export function useIntegrationActions() {
  const { showToast } = useCustomToast();
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  const triggerOAuthFlow = async (
    provider: string,
    remoteUrl: string,
    customScopeOverride?: string,
    existingPopup?: Window | null,
    preDiscoveredMetadata?: any
  ) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // 0. Synchronously open blank popup on desktop user gesture before async network calls (if not pre-opened)
    let preOpenedPopup: Window | null = existingPopup ?? null;
    if (!isMobile && typeof window !== 'undefined' && !preOpenedPopup) {
      try {
        preOpenedPopup = window.open('', 'oauth-popup', 'width=600,height=750,status=no,resizable=yes');
      } catch {
        preOpenedPopup = null;
      }
    }

    if (preOpenedPopup && !preOpenedPopup.closed) {
      try {
        preOpenedPopup.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>Connecting to ${provider}...</title></head>
            <body style="font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#09090b;color:#f4f4f5;">
              <div style="text-align:center;">
                <div style="display:inline-block;width:24px;height:24px;border:2px solid #3f3f46;border-top-color:#f4f4f5;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
                <p style="margin-top:14px;font-size:13px;color:#a1a1aa;font-weight:500;">Connecting to ${provider}...</p>
              </div>
              <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            </body>
          </html>
        `);
      } catch {
        // ignore doc write restrictions
      }
    }

    try {
      showToast({
        title: 'Authorizing App',
        message: 'Discovering remote MCP server OAuth config...',
        type: 'info',
        mode: 'capsule'
      });

      // 1. Discover OAuth Metadata from the remote MCP server (reuse pre-discovered if provided)
      const metadata = preDiscoveredMetadata || (await discoverOAuthMetadata(remoteUrl));
      if (!metadata) {
        throw new Error('Could not discover OAuth metadata endpoints on this remote MCP server.');
      }

      const { origin } = window.location;
      const redirectUri = `${origin}/auth/callback`;

      // Scope policy (same for Cal as Notion/Linear/etc. hosted MCP):
      // - Explicit custom connector scopes always win.
      // - Built-in PROVIDER_SCOPES only when non-empty (e.g. GitHub `repo`).
      // - Hosted MCP with empty catalog scopes (Cal, Notion, …): pure DCR,
      //   no client-side scope injection; server owns upstream scopes.
      // - If AS advertises scopes_supported, intersect when we do request scopes.
      const hasExplicitScope =
        typeof customScopeOverride === 'string' && customScopeOverride.trim().length > 0;
      const catalogScope = (PROVIDER_SCOPES[provider] || '').trim() || undefined;
      const configuredScope = hasExplicitScope
        ? customScopeOverride!.trim()
        : catalogScope;
      const negotiatedScope = resolveSupportedOAuthScope(
        configuredScope,
        metadata.scopes_supported,
        { allowUnlistedRequest: hasExplicitScope || Boolean(catalogScope) },
      );

      const stateId = Math.random().toString(36).substring(2, 15);
      const csrf = Math.random().toString(36).substring(2, 15);

      // 2. Dynamic client registration (same path for Cal and every other MCP OAuth host)
      let clientId = '';
      let clientSecret: string | undefined = undefined;
      let authorizationScope: string | undefined;
      if (metadata.registration_endpoint) {
        localStorage.removeItem(`mcp_oauth_client_${provider}`);
        localStorage.removeItem(`mcp_oauth_secret_${provider}`);
        localStorage.removeItem(`mcp_oauth_scope_${provider}`);
        try {
          // Only pass a scope into DCR when we intentionally configured one
          // (GitHub / custom). Cal/Notion-style hosts: register with no scope.
          const registrationScope = negotiatedScope;
          const reg = await registerMcpClient(
            metadata.registration_endpoint,
            redirectUri,
            registrationScope,
          );
          clientId = reg.clientId;
          clientSecret = reg.clientSecret;
          // Authorize with only what DCR granted (or what we registered).
          // Do not invent a larger list after registration.
          authorizationScope = reg.scope || registrationScope;
          localStorage.setItem(`mcp_oauth_client_${provider}`, clientId);
          if (clientSecret) {
            localStorage.setItem(`mcp_oauth_secret_${provider}`, clientSecret);
          }
          if (authorizationScope) {
            localStorage.setItem(`mcp_oauth_scope_${provider}`, authorizationScope);
          }
        } catch (regErr) {
          console.warn('[OAuth Flow] Dynamic client registration failed, falling back to paradox-local client ID:', regErr);
          clientId = 'paradox-local';
          authorizationScope = negotiatedScope;
        }
      } else {
        clientId = 'paradox-local';
        authorizationScope = negotiatedScope;
      }

      // 3. Generate PKCE params
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      sessionStorage.setItem('oauth_pending_csrf', csrf);
      sessionStorage.setItem('oauth_pending_verifier', codeVerifier);
      sessionStorage.setItem('oauth_pending_client', clientId);
      sessionStorage.removeItem('oauth_pending_secret');
      sessionStorage.removeItem('oauth_pending_scope');
      if (clientSecret) {
        sessionStorage.setItem('oauth_pending_secret', clientSecret);
      }
      if (authorizationScope) {
        sessionStorage.setItem('oauth_pending_scope', authorizationScope);
      }
      sessionStorage.setItem('oauth_pending_token_endpoint', metadata.token_endpoint);

      const state = encodeURIComponent(JSON.stringify({ 
        provider, 
        isMobile, 
        csrf, 
        stateId, 
        remoteUrl 
      }));

      // 4. Authorize URL (MCP host). Optional resource indicator for MCP OAuth.
      let authorizeBase = metadata.authorization_endpoint;
      try {
        const endpointUrl = new URL(authorizeBase);
        endpointUrl.searchParams.delete('scope');
        authorizeBase = endpointUrl.toString();
      } catch {
        // keep original
      }
      const hasQuery = authorizeBase.includes('?');
      let authorizeUrl =
        `${authorizeBase}${hasQuery ? '&' : '?'}` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}` +
        `&code_challenge=${encodeURIComponent(codeChallenge)}` +
        `&code_challenge_method=S256` +
        `&response_type=code`;
      if (authorizationScope) {
        authorizeUrl += `&scope=${encodeURIComponent(authorizationScope)}`;
      }
      // MCP authorization often expects the resource (MCP server URL).
      try {
        const resource = new URL(remoteUrl).origin;
        if (resource) {
          authorizeUrl += `&resource=${encodeURIComponent(remoteUrl.endsWith('/mcp') ? remoteUrl : `${resource}/mcp`)}`;
        }
      } catch {
        // ignore invalid remoteUrl
      }

      if (isMobile) {
        localStorage.setItem('mcp_oauth_restore_state', JSON.stringify({ provider }));
        window.location.href = authorizeUrl;
        return;
      }

      // Desktop Flow: Strictly use Popup Window
      let targetPopup = preOpenedPopup && !preOpenedPopup.closed ? preOpenedPopup : null;
      if (!targetPopup) {
        try {
          targetPopup = window.open(authorizeUrl, 'oauth-popup', 'width=600,height=750,status=no,resizable=yes');
        } catch {
          targetPopup = null;
        }
      } else {
        targetPopup.location.href = authorizeUrl;
        targetPopup.focus?.();
      }

      if (targetPopup && !targetPopup.closed) {
        const handleMessage = async (event: MessageEvent) => {
          if (
            event.origin === window.location.origin && 
            event.data?.type === 'AUTH_SUCCESS' && 
            event.data?.provider === provider
          ) {
            window.removeEventListener('message', handleMessage);
            showToast({
              title: 'App Authorized',
              message: `Successfully authenticated with ${provider.charAt(0).toUpperCase() + provider.slice(1)}! Syncing tools…`,
              type: 'success',
              mode: 'capsule'
            });
            await syncTools(provider);
          }
        };
        
        window.addEventListener('message', handleMessage);
      } else {
        showToast({
          title: 'Pop-up Blocked',
          message: 'Please allow pop-ups for this site to complete authentication.',
          type: 'error',
          mode: 'capsule'
        });
      }
    } catch (err: any) {
      if (preOpenedPopup && !preOpenedPopup.closed) {
        preOpenedPopup.close();
      }
      console.error(err);
      showToast({
        title: 'Authorization Failed',
        message: err.message || 'Could not initiate login consent flow.',
        type: 'error',
        mode: 'capsule'
      });
    }
  };

  // OAuth triggering flow
  const handleConnectOAuth = async (provider: string, remoteUrl: string) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Open popup synchronously on initial user click BEFORE any async network calls
    let syncPopup: Window | null = null;
    if (!isMobile && typeof window !== 'undefined') {
      try {
        syncPopup = window.open('', 'oauth-popup', 'width=600,height=750,status=no,resizable=yes');
      } catch {
        syncPopup = null;
      }
    }

    try {
      showToast({
        title: 'Connecting Account',
        message: `Setting up connection to ${provider}...`,
        type: 'info',
        mode: 'capsule'
      });

      // 1. Probe remote server OAuth capability
      let supportsOAuth = false;
      let metadata: any = null;
      try {
        metadata = await discoverOAuthMetadata(remoteUrl);
        if (metadata && metadata.authorization_endpoint && metadata.token_endpoint) {
          supportsOAuth = true;
        }
      } catch (err) {
        console.log('[OAuth Probe] Remote server does not support OAuth, registering as public:', err);
      }

      const tmpl = PROVIDER_TEMPLATES.find(t => t.id === provider);
      const name = tmpl?.name || provider.charAt(0).toUpperCase() + provider.slice(1);

      if (!supportsOAuth) {
        if (syncPopup && !syncPopup.closed) {
          syncPopup.close();
        }

        // Register as No Auth / Public
        await db.mcpIntegrations.put({
          id: provider,
          name,
          url: remoteUrl,
          connectionMode: 'auto',
          authType: 'none',
          isEnabled: true,
          status: 'connected',
          cachedTools: [],
          lastToolSync: 0,
          createdAt: Date.now()
        });

        showToast({
          title: 'Connected',
          message: `${name} connected successfully!`,
          type: 'success',
          mode: 'capsule'
        });

        // Sync tools in background
        await syncTools(provider);
        return;
      }
      
      // Clear any stale scope from a previous failed attempt so reconnect
      // re-negotiates cleanly (stale oversized scope re-triggers Cal errors).
      await db.mcpIntegrations.put({
        id: provider,
        name,
        url: remoteUrl,
        connectionMode: 'auto', // Default to auto checks
        authType: 'oauth',
        isEnabled: true,
        status: 'disconnected',
        scope: undefined,
        cachedTools: [],
        lastToolSync: 0,
        createdAt: Date.now()
      });

      // Fresh OAuth negotiation each connect — pass pre-opened popup reference and pre-discovered metadata
      await triggerOAuthFlow(provider, remoteUrl, undefined, syncPopup, metadata);
    } catch (e: any) {
      if (syncPopup && !syncPopup.closed) {
        syncPopup.close();
      }
      showToast({
        title: 'Connection Failed',
        message: e.message || 'Could not register integration.',
        type: 'error',
        mode: 'capsule'
      });
    }
  };
  // Synchronize tools list from Client-Side SSE or Proxy Discovery API
  const syncTools = async (integrationId: string) => {
    setIsSyncing(prev => ({ ...prev, [integrationId]: true }));
    try {
      // Refresh token if expired or expiring before discovery check
      await preflightRefreshIntegrations();

      const record = await db.mcpIntegrations.get(integrationId);
      if (!record) return;

      // If we don't have an access token yet and auth is OAuth, trigger login flow immediately
      if (record.authType === 'oauth' && !record.accessToken) {
        await triggerOAuthFlow(integrationId, record.url);
        setIsSyncing(prev => ({ ...prev, [integrationId]: false }));
        return;
      }

      let tools: any[] = [];
      let syncError = '';

      // 1. If connectionMode is 'direct' or 'auto', try browser direct SSE handshake
      if (record.connectionMode === 'direct' || record.connectionMode === 'auto') {
        try {
          console.log(`[MCP Sync] Attempting direct browser tools list for ${record.name} at ${record.url}`);
          tools = await discoverDirectTools(record.url, record.accessToken);
          console.log(`[MCP Sync] Browser direct tools list success: loaded ${tools.length} tools.`);
        } catch (err: any) {
          console.warn(`[MCP Sync] Browser direct tools list failed for ${record.name}:`, err);
          syncError = err.message || '';
          // If connectionMode is strictly direct, propagate error. Otherwise fallback to proxy in auto.
          if (record.connectionMode === 'direct') {
            throw new Error(`Direct connection failed: ${err.message || 'CORS block or server offline.'}`);
          }
        }
      }

      // 2. Fallback: Proxy discovery via Next.js backend server
      if (tools.length === 0 && (record.connectionMode === 'proxy' || record.connectionMode === 'auto')) {
        console.log(`[MCP Sync] Attempting proxy backend tools list for ${record.name} at ${record.url}`);
        const res = await fetch('/api/mcp/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: record.url,
            accessToken: record.accessToken
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || syncError || 'Failed to fetch schemas via proxy.');
        }

        const data = await res.json();
        // Check if preflight returned an authorization request URL
        if (data.requiresAuth && data.authorizationUrl) {
          console.log(`[MCP Sync] Server challenged with auth request URL: ${data.authorizationUrl}`);
          showToast({
            title: 'Authorization Required',
            message: `Opening login portal for ${record.name}...`,
            type: 'info',
            mode: 'capsule'
          });

          let popup: Window | null = null;
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          if (!isMobile) {
            try {
              popup = window.open(data.authorizationUrl, 'oauth-popup', 'width=600,height=750,status=no,resizable=yes');
            } catch {
              popup = null;
            }
          }

          if (!popup || popup.closed) {
            localStorage.setItem('mcp_oauth_restore_state', JSON.stringify({ provider: integrationId }));
            window.location.href = data.authorizationUrl;
            setIsSyncing(prev => ({ ...prev, [integrationId]: false }));
            return;
          }
          
          const handleMessage = (event: MessageEvent) => {
            if (
              event.origin === window.location.origin && 
              event.data?.type === 'AUTH_SUCCESS' && 
              event.data?.provider === integrationId
            ) {
              window.removeEventListener('message', handleMessage);
              // Retry sync schema after popup authorization success!
              syncTools(integrationId);
            }
          };
          window.addEventListener('message', handleMessage);
          setIsSyncing(prev => ({ ...prev, [integrationId]: false }));
          return;
        }

        tools = data.tools || [];
        console.log(`[MCP Sync] Proxy backend tools list success: loaded ${tools.length} tools.`);
      }

      // Namespace the tools using the integration ID to prevent collision if they aren't already namespaced
      const namespacedTools = tools.map((t: any) => {
        const cleanName = t.name.replace(/:/g, '_');
        const prefix = `${integrationId.toLowerCase()}_`;
        const namespacedName = cleanName.startsWith(prefix) ? cleanName : `${prefix}${cleanName}`;
        return {
          name: namespacedName,
          namespacedName: namespacedName,
          description: t.description || 'No description provided.',
          inputSchema: t.inputSchema || {}
        };
      });

      await db.mcpIntegrations.update(integrationId, {
        cachedTools: namespacedTools,
        lastToolSync: Date.now(),
        status: 'connected'
      });

      showToast({
        title: 'Synchronization Complete',
        message: `Loaded ${namespacedTools.length} tool definitions from integration.`,
        type: 'success',
        mode: 'capsule'
      });
    } catch (err: any) {
      console.error(err);
      await db.mcpIntegrations.update(integrationId, { status: 'unreachable' });
      showToast({
        title: 'Sync Failed',
        message: err.message || 'Connection to remote server failed.',
        type: 'error',
        mode: 'capsule'
      });
    } finally {
      setIsSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  };
  // Disconnect / Delete integration
  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await db.mcpIntegrations.delete(integrationId);
      showToast({
        title: 'Integration Removed',
        message: 'Deleted integration credentials from local database.',
        type: 'success',
        mode: 'capsule'
      });
    } catch (err) {
      console.error(err);
    }
  };


  return { isSyncing, triggerOAuthFlow, handleConnectOAuth, syncTools, handleDeleteIntegration };
}
