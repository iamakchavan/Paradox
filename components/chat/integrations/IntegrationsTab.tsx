'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, MCPIntegration } from '@/lib/db';
import { executeDirectTool, discoverDirectTools, preflightRefreshIntegrations } from '@/lib/mcp-client';
import { 
  Github, Calendar, Puzzle, RefreshCw, Trash2, Plus, 
  Check, AlertTriangle, Globe, Lock, Settings, ChevronRight, X, Info,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomToast } from '@/components/ui/custom-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  discoverOAuthMetadata, 
  registerMcpClient, 
  generateCodeVerifier, 
  generateCodeChallenge 
} from '@/lib/mcp-oauth';

const formatToolName = (name: string) => {
  let cleanName = name.replace(/^__+|__+$/g, '');
  cleanName = cleanName.replace(/[_-]+/g, ' ');
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PROVIDER_SCOPES: Record<string, string> = {
  github: 'repo',
  cal: 'EVENT_TYPE_READ EVENT_TYPE_WRITE BOOKING_READ BOOKING_WRITE SCHEDULE_READ SCHEDULE_WRITE APPS_READ APPS_WRITE PROFILE_READ PROFILE_WRITE ORG_BOOKING_READ TEAM_BOOKING_READ ORG_MEMBERSHIP_READ ORG_MEMBERSHIP_WRITE ORG_ROUTING_FORM_READ',
  notion: ''
};

const GitHubLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className={props.className} fill="currentColor" style={props.style}>
    <path d="M280.5 426.5C214.5 418.5 168 371 168 309.5C168 284.5 177 257.5 192 239.5C185.5 223 186.5 188 194 173.5C214 171 241 181.5 257 196C276 190 296 187 320.5 187C345 187 365 190 383 195.5C398.5 181.5 426 171 446 173.5C453 187 454 222 447.5 239C463.5 258 472 283.5 472 309.5C472 371 425.5 417.5 358.5 426C375.5 437 387 461 387 488.5L387 540.5C387 555.5 399.5 564 414.5 558C505 523.5 576 433 576 321C576 179.5 461 64 319.5 64C178 64 64 179.5 64 321C64 432 134.5 524 229.5 558.5C243 563.5 256 554.5 256 541L256 501C249 504 240 506 232 506C199 506 179.5 488 165.5 454.5C160 441 154 433 142.5 431.5C136.5 431 134.5 428.5 134.5 425.5C134.5 419.5 144.5 415 154.5 415C169 415 181.5 424 194.5 442.5C204.5 457 215 463.5 227.5 463.5C240 463.5 248 459 259.5 447.5C268 439 274.5 431.5 280.5 426.5z"/>
  </svg>
);

const NotionLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className={props.className} fill="currentColor" style={props.style}>
    <path d="M158.9 164.2C173.8 176.3 179.4 175.4 207.5 173.5L471.8 157.6C477.4 157.6 472.7 152 470.9 151.1L426.9 119.4C418.5 112.9 407.3 105.4 385.8 107.3L129.9 125.9C120.6 126.8 118.7 131.5 122.4 135.2L158.8 164.1zM174.8 225.8L174.8 503.9C174.8 518.8 182.3 524.4 199.1 523.5L489.6 506.7C506.4 505.8 508.3 495.5 508.3 483.4L508.3 207.2C508.3 195.1 503.6 188.5 493.3 189.5L189.7 207.1C178.5 208 174.8 213.6 174.8 225.8zM461.5 240.7C463.4 249.1 461.5 257.5 453.1 258.5L439.1 261.3L439.1 466.6C426.9 473.1 415.7 476.9 406.4 476.9C391.4 476.9 387.7 472.2 376.5 458.2L285 314.5L285 453.5L314 460C314 460 314 476.8 290.6 476.8L226.2 480.5C224.3 476.8 226.2 467.4 232.7 465.6L249.5 460.9L249.5 277.1L226.2 275.2C224.3 266.8 229 254.7 242.1 253.7L311.2 249L406.5 394.6L406.5 265.8L382.2 263C380.3 252.7 387.8 245.3 397.1 244.3L461.6 240.5zM108.4 100.7L374.6 81.1C407.3 78.3 415.7 80.2 436.2 95.1L521.2 154.8C535.2 165.1 539.9 167.9 539.9 179.1L539.9 506.7C539.9 527.2 532.4 539.4 506.3 541.2L197.2 559.8C177.6 560.7 168.2 557.9 158 544.9L95.4 463.7C84.2 448.8 79.5 437.6 79.5 424.5L79.5 133.3C79.5 116.5 87 102.5 108.4 100.6z"/>
  </svg>
);

const CalLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={props.className} style={props.style}>
    <path d="M458 512H56c-30.4 0-55-24.6-55-55V55C1 24.6 25.6 0 56 0h402c30.4 0 55 24.6 55 55v402c0 30.4-24.6 55-55 55" style={{ fill: '#fff' }}/>
    <path d="M162.8 347.3c-50.4 0-88.4-39.9-88.4-89.3s35.9-89.6 88.4-89.6c27.9 0 47 8.6 62.1 28l-24.3 20.1c-10.1-10.8-22.5-16.2-37.8-16.2-34.1 0-52.8 26.1-52.8 57.6s20.5 57.1 52.8 57.1c15.1 0 28-5.3 38.4-16.2l23.9 21c-14.5 18.9-34.3 27.5-62.3 27.5m166.4-131.2h32.7v128.1h-32.7v-18.7c-6.7 13.2-18.1 22.2-39.7 22.2-34.6 0-62.3-30.1-62.3-66.9 0-37 27.7-66.9 62.3-66.9 21.5 0 33 8.9 39.7 22.2zm1.1 64.5c0-20-13.8-36.6-35.4-36.6-20.8 0-34.4 16.7-34.4 36.6 0 19.4 13.6 36.6 34.4 36.6 21.4 0 35.4-16.7 35.4-36.6M385 164.3h32.7v179.6H385z" style={{ fill: '#242424' }}/>
  </svg>
);

const PROVIDER_TEMPLATES = [
  { id: 'github', name: 'GitHub', desc: 'Read code, search files, manage repos, and commit work.', icon: GitHubLogo, type: 'oauth', url: 'https://mcp.github.com/mcp', category: 'Featured' },
  { id: 'notion', name: 'Notion', desc: 'Search and sync workspace pages, databases, and lists.', icon: NotionLogo, type: 'oauth', url: 'https://mcp.notion.com/mcp', category: 'Featured' },
  { id: 'cal', name: 'Cal.com', desc: 'Read calendars, check availability, and schedule meetings.', icon: CalLogo, type: 'oauth', url: 'https://mcp.cal.com/mcp', category: 'Featured' }
];

export function IntegrationsTab() {
  const { showToast } = useCustomToast();
  const integrations = useLiveQuery(() => db.mcpIntegrations.toArray()) || [];
  
  const [selectedIntegration, setSelectedIntegration] = useState<MCPIntegration | null>(null);
  const [isRegisteringCustom, setIsRegisteringCustom] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'connectors'>('connectors');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTmplModal, setActiveTmplModal] = useState<any | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);

    const restoreProvider = sessionStorage.getItem('settings-restore-provider');
    if (!restoreProvider) return;

    // A. Check templates first (they are always in-memory and load instantly)
    const tmpl = PROVIDER_TEMPLATES.find(t => t.id === restoreProvider);
    if (tmpl) {
      setActiveTmplModal(tmpl);
      sessionStorage.removeItem('settings-restore-provider');
      return;
    }

    // B. Check custom integrations (wait until loaded from IndexedDB query)
    const conn = integrations.find(i => i.id === restoreProvider);
    if (conn) {
      setSelectedIntegration(conn);
      sessionStorage.removeItem('settings-restore-provider');
    }
  }, [integrations]);

  // Custom Integration Form state
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customMode, setCustomMode] = useState<'auto' | 'direct' | 'proxy'>('auto');
  const [customAuthType, setCustomAuthType] = useState<'none' | 'apiKey' | 'oauth'>('none');
  const [customAccessToken, setCustomAccessToken] = useState('');

  const [detectingAuth, setDetectingAuth] = useState(false);
  const [detectedAuthResult, setDetectedAuthResult] = useState<'oauth' | 'apiKey' | 'none' | null>(null);
  const detectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleUrlChange = async (urlVal: string) => {
    setDetectedAuthResult(null);

    // Only probe if it's a valid URL starting with http:// or https://
    if (!urlVal.startsWith('http://') && !urlVal.startsWith('https://')) {
      return;
    }

    setDetectingAuth(true);
    try {
      // 1. Check for OAuth first
      const metadata = await discoverOAuthMetadata(urlVal);
      if (metadata && metadata.authorization_endpoint && metadata.token_endpoint) {
        setDetectedAuthResult('oauth');
        setCustomAuthType('oauth');
        return;
      }

      // 2. Check if it's open or requires a token
      const probeRes = await fetch('/api/mcp/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlVal
        })
      });

      if (probeRes.ok) {
        setDetectedAuthResult('none');
        setCustomAuthType('none');
      } else {
        const errData = await probeRes.json().catch(() => ({}));
        const errMsg = errData.error || '';
        if (
          probeRes.status === 401 ||
          errMsg.includes('401') ||
          errMsg.toLowerCase().includes('credentials required') ||
          errMsg.toLowerCase().includes('api key') ||
          errMsg.toLowerCase().includes('invalid_token')
        ) {
          setDetectedAuthResult('apiKey');
          setCustomAuthType('apiKey');
        } else {
          setDetectedAuthResult('none');
          setCustomAuthType('none');
        }
      }
    } catch (err) {
      console.warn('[Auto-detect Auth] Probe failed', err);
      setDetectedAuthResult('none');
      setCustomAuthType('none');
    } finally {
      setDetectingAuth(false);
    }
  };

  const handleUrlInput = (urlVal: string) => {
    setCustomUrl(urlVal);
    
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
    }

    detectTimeoutRef.current = setTimeout(() => {
      handleUrlChange(urlVal);
    }, 600);
  };

  const resetCustomForm = () => {
    setCustomName('');
    setCustomUrl('');
    setCustomMode('auto');
    setCustomAuthType('none');
    setCustomAccessToken('');
    setDetectingAuth(false);
    setDetectedAuthResult(null);
    setIsConnecting(false);
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
    }
  };

  const triggerOAuthFlow = async (provider: string, remoteUrl: string) => {
    try {
      showToast({
        title: 'Authorizing App',
        message: 'Discovering remote MCP server OAuth config...',
        type: 'info',
        mode: 'capsule'
      });

      // 1. Discover OAuth Metadata from the remote MCP server
      const metadata = await discoverOAuthMetadata(remoteUrl);
      if (!metadata) {
        throw new Error('Could not discover OAuth metadata endpoints on this remote MCP server.');
      }

      const isMobile = window.innerWidth < 768;
      const { origin } = window.location;
      const redirectUri = `${origin}/auth/callback`;
      const scope = PROVIDER_SCOPES[provider] || '';

      const stateId = Math.random().toString(36).substring(2, 15);
      const csrf = Math.random().toString(36).substring(2, 15);

      // 2. Register OAuth Client dynamically if supported
      let clientId = '';
      if (metadata.registration_endpoint) {
        localStorage.removeItem(`mcp_oauth_client_${provider}`);
        try {
          clientId = await registerMcpClient(metadata.registration_endpoint, redirectUri, scope);
          localStorage.setItem(`mcp_oauth_client_${provider}`, clientId);
        } catch (regErr) {
          console.warn('[OAuth Flow] Dynamic client registration failed, falling back to paradox-local client ID:', regErr);
          clientId = 'paradox-local';
        }
      } else {
        clientId = 'paradox-local'; // Default fallback client ID
      }

      // 3. Generate PKCE params
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      localStorage.setItem(`oauth_csrf_${provider}_${stateId}`, csrf);
      localStorage.setItem(`oauth_verifier_${provider}_${stateId}`, codeVerifier);
      localStorage.setItem(`oauth_client_${provider}_${stateId}`, clientId);
      localStorage.setItem(`oauth_token_endpoint_${provider}_${stateId}`, metadata.token_endpoint);

      const state = encodeURIComponent(JSON.stringify({ 
        provider, 
        isMobile, 
        csrf, 
        stateId, 
        remoteUrl 
      }));

      // 4. Formulate the official Authorize URL redirecting to the remote gateway
      const authorizeUrl = `${metadata.authorization_endpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256&response_type=code`;

      if (isMobile) {
        localStorage.setItem('mcp_oauth_restore_state', JSON.stringify({ provider }));
        window.location.href = authorizeUrl;
      } else {
        const popup = window.open(authorizeUrl, 'oauth-popup', 'width=600,height=750,status=no,resizable=yes');
        
        const handleMessage = (event: MessageEvent) => {
          if (
            event.origin === window.location.origin && 
            event.data?.type === 'AUTH_SUCCESS' && 
            event.data?.provider === provider
          ) {
            window.removeEventListener('message', handleMessage);
            showToast({
              title: 'App Authorized',
              message: `Successfully authenticated with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`,
              type: 'success',
              mode: 'capsule'
            });
            // Reload tools list after successful login callback
            syncTools(provider);
          }
        };
        
        window.addEventListener('message', handleMessage);
      }
    } catch (err: any) {
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
    try {
      showToast({
        title: 'Connecting Account',
        message: `Setting up connection to ${provider}...`,
        type: 'info',
        mode: 'capsule'
      });

      const name = provider.charAt(0).toUpperCase() + provider.slice(1);
      
      await db.mcpIntegrations.put({
        id: provider,
        name,
        url: remoteUrl,
        connectionMode: 'auto', // Default to auto checks
        authType: 'oauth',
        isEnabled: true,
        status: 'disconnected',
        cachedTools: [],
        lastToolSync: 0,
        createdAt: Date.now()
      });

      // Launch dynamic client registration and PKCE flow immediately
      await triggerOAuthFlow(provider, remoteUrl);
    } catch (e: any) {
      showToast({
        title: 'Connection Failed',
        message: e.message || 'Could not register integration.',
        type: 'error',
        mode: 'capsule'
      });
    }
  };

  const handleTemplateClick = (tmpl: any) => {
    setActiveTmplModal(tmpl);
    setShowAllTools(false);
  };

  // Register custom SSE integration
  const handleRegisterCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customUrl) {
      showToast({
        title: 'Missing Fields',
        message: 'Name and SSE endpoint URL are required.',
        type: 'error',
        mode: 'capsule'
      });
      return;
    }

    setIsConnecting(true);
    try {
      const parsedUrl = new URL(customUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Endpoint must start with http:// or https://');
      }

      const id = customName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      showToast({
        title: 'Registering Connector',
        message: 'Connecting to remote server and detecting capabilities...',
        type: 'info',
        mode: 'capsule'
      });

      // 1. Pre-flight check: Autodetect remote OAuth capabilities (RFC 8414)
      let detectedAuthType = customAuthType;
      let supportsOAuth = false;

      try {
        const metadata = await discoverOAuthMetadata(customUrl);
        if (metadata && metadata.authorization_endpoint && metadata.token_endpoint) {
          supportsOAuth = true;
          detectedAuthType = 'oauth';
        }
      } catch (err) {
        console.log('[OAuth Autodetect] No OAuth metadata found on server, falling back', err);
      }

      const isOAuth = customAuthType === 'oauth' || supportsOAuth;

      if (isOAuth) {
        // Register integration with status 'disconnected' and authType 'oauth'
        await db.mcpIntegrations.put({
          id,
          name: customName,
          url: customUrl,
          connectionMode: customMode,
          authType: 'oauth',
          isEnabled: true,
          status: 'disconnected',
          cachedTools: [],
          lastToolSync: 0,
          createdAt: Date.now()
        });

        showToast({
          title: customAuthType === 'oauth' ? 'OAuth Integration' : 'OAuth Autodetected',
          message: 'OAuth enabled! Launching authentication consent flow...',
          type: 'success',
          mode: 'capsule'
        });

        const urlToRegister = customUrl;
        setIsRegisteringCustom(false);
        setShowAdvanced(false);
        resetCustomForm();

        // Launch PKCE authorization flow immediately
        await triggerOAuthFlow(id, urlToRegister);
        return;
      }

      // 2. Pre-flight connection probe (only for non-OAuth connectors)
      if (!isOAuth) {
        const probeRes = await fetch('/api/mcp/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: customUrl,
            accessToken: customAccessToken || undefined
          })
        });

        if (!probeRes.ok) {
          const errData = await probeRes.json().catch(() => ({}));
          const errMsg = errData.error || '';
          if (
            probeRes.status === 401 ||
            errMsg.includes('401') ||
            errMsg.toLowerCase().includes('credentials required') ||
            errMsg.toLowerCase().includes('api key') ||
            errMsg.toLowerCase().includes('invalid_token')
          ) {
            throw new Error('Authentication Required: This server requires an Access Token. Please open Advanced Settings, change Auth Type to Bearer Token, and enter your API key.');
          }
          throw new Error(errMsg || `Could not connect to the remote server (status: ${probeRes.status})`);
        }
      }

      // 3. Normal Flow: No OAuth detected, register as none/bearer
      await db.mcpIntegrations.put({
        id,
        name: customName,
        url: customUrl,
        connectionMode: customMode,
        authType: customAuthType,
        accessToken: customAccessToken || undefined,
        isEnabled: true,
        status: 'connected',
        cachedTools: [],
        lastToolSync: 0,
        createdAt: Date.now()
      });

      showToast({
        title: 'Custom Integration Created',
        message: `Registered ${customName} successfully. Syncing tools...`,
        type: 'success',
        mode: 'capsule'
      });

      setIsRegisteringCustom(false);
      setShowAdvanced(false);
      resetCustomForm();

      await syncTools(id);
    } catch (err: any) {
      showToast({
        title: 'Registration Error',
        message: err.message || 'Invalid server URL structure.',
        type: 'error',
        mode: 'capsule'
      });
    } finally {
      setIsConnecting(false);
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
          const popup = window.open(data.authorizationUrl, 'oauth-popup', 'width=600,height=750,status=no,resizable=yes');
          
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

      // Namespace the tools using the integration ID to prevent collision
      const namespacedTools = tools.map((t: any) => ({
        name: t.name,
        namespacedName: `${integrationId.toLowerCase()}_${t.name.toLowerCase()}`,
        description: t.description || 'No description provided.',
        inputSchema: t.inputSchema || {}
      }));

      await db.mcpIntegrations.update(integrationId, {
        cachedTools: namespacedTools,
        lastToolSync: Date.now(),
        status: 'connected'
      });

      // Update selected detail view if open
      if (selectedIntegration?.id === integrationId) {
        const updated = await db.mcpIntegrations.get(integrationId);
        if (updated) setSelectedIntegration(updated);
      }

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

  // Toggle tool enabled state
  const handleToggleEnabled = async (integrationId: string, currentVal: boolean) => {
    try {
      await db.mcpIntegrations.update(integrationId, { isEnabled: !currentVal });
      if (selectedIntegration?.id === integrationId) {
        setSelectedIntegration(prev => prev ? { ...prev, isEnabled: !currentVal } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Disconnect / Delete integration
  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await db.mcpIntegrations.delete(integrationId);
      setSelectedIntegration(null);
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

  // Update connection mode toggling
  const handleUpdateMode = async (integrationId: string, mode: 'auto' | 'direct' | 'proxy') => {
    try {
      await db.mcpIntegrations.update(integrationId, { connectionMode: mode });
      setSelectedIntegration(prev => prev ? { ...prev, connectionMode: mode } : null);
      showToast({
        title: 'Strategy Updated',
        message: `Set execution strategy to ${mode}.`,
        type: 'success',
        mode: 'capsule'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Custom (user SSE-registered) connections
  const customConnectors = integrations.filter(
    i => !PROVIDER_TEMPLATES.some(tmpl => tmpl.id === i.id)
  );

  const filteredCustomConnectors = customConnectors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Filter templates
  const filteredTemplates = PROVIDER_TEMPLATES.filter(tmpl => 
    tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tmpl.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Unified connected tools
  const allConnectedTools = integrations.flatMap(integration => 
    (integration.cachedTools || []).map(tool => ({
      ...tool,
      integrationName: integration.name,
      integrationId: integration.id
    }))
  );

  const filteredTools = allConnectedTools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.integrationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col min-h-0 text-foreground font-sans space-y-5">
      {/* Title & Action Row */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Tools and Connectors</h2>
        <Button
          onClick={() => setIsRegisteringCustom(true)}
          className="h-8 px-4 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 border border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-150 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
        >
          New Connector
        </Button>
      </div>

      {/* Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border shrink-0">
        {/* Switcher tabs */}
        <div className="flex gap-1 items-center bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-full border border-zinc-200 dark:border-border/40 w-fit shrink-0">
          <button 
            type="button"
            onClick={() => setActiveSubTab('skills')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer select-none font-medium whitespace-nowrap",
              activeSubTab === 'skills' 
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs" 
                : "text-zinc-500 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-foreground"
            )}
          >
            All Tools
          </button>
          <button 
            type="button"
            onClick={() => setActiveSubTab('connectors')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer select-none font-medium whitespace-nowrap",
              activeSubTab === 'connectors' 
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs" 
                : "text-zinc-500 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-foreground"
            )}
          >
            Connectors
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="h-8.5 pl-8 pr-3 text-xs bg-zinc-100/60 dark:bg-zinc-950/20 border-zinc-200 dark:border-border rounded-lg focus-visible:ring-cyan-500/20"
          />
        </div>
      </div>

      {/* Main Scroll Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-0.5 pb-4">
        {activeSubTab === 'skills' ? (
          /* Skills Sub-Tab View */
          filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-9 bg-zinc-50/5 dark:bg-zinc-950/10 border border-dashed border-zinc-200/20 dark:border-zinc-850 rounded-2xl">
              <Puzzle className="w-9 h-9 text-muted-foreground/45 mb-3" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground text-center font-medium">
                No active skills or tools found matching your search query.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const grouped = filteredTools.reduce((acc, tool) => {
                  if (!acc[tool.integrationName]) {
                    acc[tool.integrationName] = [];
                  }
                  acc[tool.integrationName].push(tool);
                  return acc;
                }, {} as Record<string, typeof filteredTools>);

                return Object.entries(grouped).map(([integrationName, tools]) => (
                  <div key={integrationName} className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground/60 tracking-wider uppercase mb-1">
                      {integrationName} Tools ({tools.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {tools.map((tool) => (
                        <div 
                          key={`${tool.integrationId}-${tool.name}`}
                          onClick={() => setSelectedSkill(tool)}
                          className="flex flex-col p-5 h-36 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-800 hover:shadow-xs transition-all duration-200 text-left cursor-pointer select-none"
                        >
                          <div className="flex items-start justify-between mb-2 gap-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                {formatToolName(tool.name)}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                                {tool.name}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-normal mt-1.5 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )
        ) : (
          /* Connectors Sub-Tab View */
          filteredTemplates.length === 0 && filteredCustomConnectors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-9 bg-zinc-50/5 dark:bg-zinc-950/10 border border-dashed border-zinc-200/20 dark:border-zinc-850 rounded-2xl">
              <Puzzle className="w-9 h-9 text-muted-foreground/45 mb-3" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground text-center font-medium">
                No connectors found matching your search.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Featured Category */}
              {(() => {
                const featured = filteredTemplates.filter(t => t.category === 'Featured');
                if (featured.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground/60 tracking-wider uppercase mb-3">Featured</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {featured.map(tmpl => {
                        const matchedConn = integrations.find(i => i.id === tmpl.id);
                        const isConnected = matchedConn && matchedConn.status === 'connected';
                        const TmplIcon = tmpl.icon;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => handleTemplateClick(tmpl)}
                            className="flex items-center gap-4 p-5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-border hover:bg-zinc-100/50 dark:hover:bg-muted/40 rounded-xl transition-colors cursor-pointer"
                          >
                            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-border/60 shrink-0 shadow-sm">
                              <TmplIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold text-foreground leading-none mb-1.5 block truncate">
                                {tmpl.name}
                              </span>
                              {isConnected ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] text-muted-foreground font-medium">Connected</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/90 line-clamp-1 leading-normal">
                                  {tmpl.desc}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Finance Category */}
              {(() => {
                const finance = filteredTemplates.filter(t => t.category === 'Finance');
                if (finance.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground/60 tracking-wider uppercase mb-3">Finance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {finance.map(tmpl => {
                        const isConnected = integrations.some(i => i.id === tmpl.id);
                        const TmplIcon = tmpl.icon;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => handleTemplateClick(tmpl)}
                            className="flex items-center gap-4 p-5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-border hover:bg-zinc-100/50 dark:hover:bg-muted/40 rounded-xl transition-colors cursor-pointer"
                          >
                            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-border/60 shrink-0 shadow-sm">
                              <TmplIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold text-foreground leading-none mb-1.5 block truncate">
                                {tmpl.name}
                              </span>
                              {isConnected ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] text-muted-foreground font-medium">Connected</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/90 line-clamp-1 leading-normal">
                                  {tmpl.desc}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Productivity Category */}
              {(() => {
                const productivity = filteredTemplates.filter(t => t.category === 'Productivity');
                if (productivity.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground/60 tracking-wider uppercase mb-3">Productivity</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {productivity.map(tmpl => {
                        const isConnected = integrations.some(i => i.id === tmpl.id);
                        const TmplIcon = tmpl.icon;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => handleTemplateClick(tmpl)}
                            className="flex items-center gap-4 p-5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-border hover:bg-zinc-100/50 dark:hover:bg-muted/40 rounded-xl transition-colors cursor-pointer"
                          >
                            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-border/60 shrink-0 shadow-sm">
                              <TmplIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold text-foreground leading-none mb-1.5 block truncate">
                                {tmpl.name}
                              </span>
                              {isConnected ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] text-muted-foreground font-medium">Connected</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/90 line-clamp-1 leading-normal">
                                  {tmpl.desc}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Custom Connectors Category */}
              {filteredCustomConnectors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground/60 tracking-wider uppercase mb-3">Custom Connectors</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredCustomConnectors.map(conn => {
                      const customTmpl = {
                        id: conn.id,
                        name: conn.name,
                        desc: 'Custom user-registered SSE Server.',
                        icon: Puzzle,
                        type: 'custom',
                        url: conn.url
                      };
                      return (
                        <div
                          key={conn.id}
                          onClick={() => handleTemplateClick(customTmpl)}
                          className="flex items-center gap-4 p-5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-border hover:bg-zinc-100/50 dark:hover:bg-muted/40 rounded-xl transition-colors cursor-pointer"
                        >
                          <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-border/60 shrink-0 shadow-sm">
                            <Puzzle className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-foreground leading-none mb-1.5 block truncate">
                              {conn.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                conn.status === 'connected' ? "bg-emerald-500" : "bg-amber-500"
                              )} />
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {conn.status === 'connected' ? 'Connected' : 'Disconnected'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* 1. App Template Details & Connection Pop-up Modal */}
      <Dialog 
        open={!!activeTmplModal} 
        onOpenChange={(open) => setActiveTmplModal(open ? activeTmplModal : null)}
      >
        <DialogContent className="w-[92%] max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-0 overflow-hidden shadow-2xl text-left [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 w-full text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shrink-0">
                {activeTmplModal && (() => {
                  const TmplIcon = activeTmplModal.icon;
                  return <TmplIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />;
                })()}
              </div>
              <div className="flex flex-col min-w-0 gap-0.5 text-left">
                <DialogTitle className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{activeTmplModal?.name}</DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500 leading-none">MCP Connector</DialogDescription>
              </div>
            </div>
            <button
              onClick={() => setActiveTmplModal(null)}
              className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-355 transition-colors p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content Details */}
          {activeTmplModal && (() => {
            const conn = integrations.find(i => i.id === activeTmplModal.id);
            return (
              <div className="px-6 pb-6 space-y-5 text-left">
                {/* Description */}
                <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed font-normal pb-1">
                  {activeTmplModal.desc}
                </p>

                {/* Server URL */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Server Endpoint URL</span>
                  <div className="text-xs font-mono text-zinc-700 dark:text-zinc-350 break-all select-all leading-normal bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 rounded-xl border border-zinc-200/65 dark:border-zinc-800/80">
                    {activeTmplModal.url}
                  </div>
                </div>

                {/* Scopes if connected */}
                {conn && PROVIDER_SCOPES[activeTmplModal.id] && (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Authorized Scopes</span>
                    <div className="text-xs font-mono text-zinc-700 dark:text-zinc-350 break-all leading-normal bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 rounded-xl border border-zinc-200/65 dark:border-zinc-800/80">
                      {PROVIDER_SCOPES[activeTmplModal.id]}
                    </div>
                  </div>
                )}

                {/* Tools listing if connected */}
                {conn && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        All tools enabled
                      </span>
                      <button
                        type="button"
                        disabled={isSyncing[conn.id]}
                        onClick={() => syncTools(conn.id)}
                        className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-350 transition-colors p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                        title="Refresh tools list"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", isSyncing[conn.id] && "animate-spin")} />
                      </button>
                    </div>

                    {!conn.cachedTools || conn.cachedTools.length === 0 ? (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                        No tools found. Click refresh to query endpoints.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="max-h-48 overflow-y-auto pr-1 no-scrollbar pt-0.5 pb-0.5">
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const toolsToRender = showAllTools 
                                ? conn.cachedTools 
                                : conn.cachedTools.slice(0, 6);
                                return toolsToRender.map((tool) => (
                                  <div
                                    key={tool.name}
                                  className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 text-[11.5px] font-mono text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full select-none"
                                >
                                  <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-550">✓</span>
                                  <span>{tool.name}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {conn.cachedTools.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setShowAllTools(!showAllTools)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer select-none block mt-1"
                          >
                            {showAllTools ? 'See less' : 'See more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status indicator if connected */}
                {conn && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Currently Connected</span>
                  </div>
                )}

                {/* Warning Disclaimer */}
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal font-normal pt-2 border-t border-zinc-100 dark:border-zinc-900/60">
                  Third-party connectors are not built or maintained by Paradox. Use caution when granting access to external services. Usage is subject to the <span className="underline hover:text-zinc-650 dark:hover:text-zinc-400 cursor-pointer transition-colors">Paradox Privacy Policy</span>.
                </p>
              </div>
            );
          })()}

          {/* Footer Action Button Tray */}
          <div className="px-6 py-4 flex justify-end items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900">
            {activeTmplModal && (() => {
              const conn = integrations.find(i => i.id === activeTmplModal.id);
              if (conn) {
                return (
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isSyncing[conn.id]}
                      onClick={() => syncTools(conn.id)}
                      className="h-8 px-4 rounded-full text-xs font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1.5"
                    >
                      <RefreshCw className={cn("w-3 h-3 text-zinc-500", isSyncing[conn.id] && "animate-spin")} />
                      Refresh Connection
                    </Button>
                    <Button
                      onClick={() => {
                        handleDeleteIntegration(conn.id);
                        setActiveTmplModal(null);
                      }}
                      className="h-8 px-4 rounded-full text-xs font-bold bg-red-600 hover:bg-red-750 dark:bg-red-650 dark:hover:bg-red-550 text-white cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Disconnect
                    </Button>
                  </>
                );
              } else {
                return (
                  <Button
                    onClick={() => {
                      handleConnectOAuth(activeTmplModal.id, activeTmplModal.url);
                      setActiveTmplModal(null);
                    }}
                    className="h-8 px-5 rounded-full text-xs font-bold bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Connect
                  </Button>
                );
              }
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Custom SSE Setup Modal */}
      <Dialog 
        open={isRegisteringCustom} 
        onOpenChange={(open) => {
          setIsRegisteringCustom(open);
          if (!open) {
            setShowAdvanced(false);
            resetCustomForm();
          }
        }}
      >
        <DialogContent className="w-[92%] max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-0 overflow-hidden shadow-2xl text-left [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 w-full text-left">
            <div className="flex flex-col min-w-0 gap-0.5 text-left">
              <DialogTitle className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">Custom Connector</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-none">
                Register a custom MCP server
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsRegisteringCustom(false);
                setShowAdvanced(false);
              }}
              className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-355 transition-colors p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleRegisterCustom} className="space-y-0">
            <div className="px-6 pb-6 space-y-4">
              {/* Connector Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-name" className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Connector Name</label>
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. My Database Search"
                  required
                  className="h-9 px-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500/15"
                />
              </div>

              {/* Server URL */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-url" className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Server Endpoint URL</label>
                <Input
                  id="custom-url"
                  value={customUrl}
                  onChange={(e) => handleUrlInput(e.target.value)}
                  placeholder="https://mcp.example.com/sse"
                  required
                  className="h-9 px-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500/15"
                />

                {detectingAuth && (
                  <div className="flex items-center gap-1.5 mt-2 text-zinc-450 dark:text-zinc-500 text-[11px] select-none text-left">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-600 dark:text-cyan-400" />
                    Checking auth type...
                  </div>
                )}

                {!detectingAuth && detectedAuthResult === 'oauth' && (
                  <div className="flex items-center gap-2 mt-2 select-none text-left">
                    <span className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/40 rounded-full text-[10.5px] font-semibold px-2.5 py-0.5 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-cyan-650 dark:text-cyan-400" />
                      OAuth (auto-registration)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(true)}
                      className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-355 underline cursor-pointer select-none"
                    >
                      Change
                    </button>
                  </div>
                )}

                {!detectingAuth && detectedAuthResult === 'apiKey' && (
                  <div className="flex items-center gap-2 mt-2 select-none text-left">
                    <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-full text-[10.5px] font-semibold px-2.5 py-0.5 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-655 dark:text-amber-400" />
                      Token Required
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(true)}
                      className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-355 underline cursor-pointer select-none"
                    >
                      Change
                    </button>
                  </div>
                )}

                {!detectingAuth && detectedAuthResult === 'none' && (
                  <div className="flex items-center gap-2 mt-2 select-none text-left">
                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-950/10 rounded-full text-[10.5px] font-semibold px-2.5 py-0.5 inline-flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5 text-emerald-650 dark:text-emerald-400" />
                      No Auth / Public
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(true)}
                      className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-355 underline cursor-pointer select-none"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Advanced Settings Accordion */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-between w-full cursor-pointer select-none"
                >
                  <span className="uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">Advanced Settings</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px]">{showAdvanced ? 'Hide' : 'Show'}</span>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "transform rotate-90")} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden pt-2"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Execution Strategy</label>
                          <Select 
                            value={customMode} 
                            onValueChange={(val: any) => setCustomMode(val)}
                          >
                            <SelectTrigger className="h-8.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-cyan-500 dark:focus:border-cyan-550 focus:outline-none">
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                            <SelectContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
                              <SelectItem value="auto" className="text-xs cursor-pointer">Auto Checks</SelectItem>
                              <SelectItem value="direct" className="text-xs cursor-pointer">Direct Browser</SelectItem>
                              <SelectItem value="proxy" className="text-xs cursor-pointer">Server Proxy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Auth Type</label>
                          <Select 
                            value={customAuthType} 
                            onValueChange={(val: any) => setCustomAuthType(val)}
                          >
                            <SelectTrigger className="h-8.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-cyan-500 dark:focus:border-cyan-550 focus:outline-none">
                              <SelectValue placeholder="Select auth type" />
                            </SelectTrigger>
                            <SelectContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
                              <SelectItem value="none" className="text-xs cursor-pointer">None / Public</SelectItem>
                              <SelectItem value="apiKey" className="text-xs cursor-pointer">Bearer Token</SelectItem>
                              <SelectItem value="oauth" className="text-xs cursor-pointer">OAuth (Consent Flow)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {customAuthType === 'apiKey' && (
                        <div className="flex flex-col gap-1.5 pt-1">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Bearer Access Token</label>
                          <Input
                            type="password"
                            value={customAccessToken}
                            onChange={(e) => setCustomAccessToken(e.target.value)}
                            placeholder="Enter authentication token"
                            className="h-9 px-3 rounded-xl text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Action Button Tray */}
            <div className="px-6 py-4 flex justify-end items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsRegisteringCustom(false);
                  setShowAdvanced(false);
                }}
                className="h-8 px-4 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all active:scale-[0.98]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={detectingAuth}
                className="h-8 px-4 rounded-full text-xs font-bold bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {detectingAuth ? 'Checking Server...' : 'Add Connector'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Skill Detail Modal Dialog */}
      <Dialog 
        open={!!selectedSkill} 
        onOpenChange={(open) => setSelectedSkill(open ? selectedSkill : null)}
      >
        <DialogContent className="w-[92%] max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-6 [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-zinc-100 dark:border-zinc-900/60 w-full text-left">
            <div className="flex flex-col min-w-0">
              <DialogTitle className="text-base font-bold text-zinc-800 dark:text-zinc-200 truncate">
                {selectedSkill ? formatToolName(selectedSkill.name) : ''}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-zinc-400 dark:text-zinc-550 mt-1.5 truncate">
                {selectedSkill?.name}
              </DialogDescription>
            </div>
            <span className="text-[10px] bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 px-2.5 py-0.5 rounded-md font-semibold shrink-0 border border-zinc-200/60 dark:border-zinc-800 select-none">
              {selectedSkill?.integrationName}
            </span>
          </div>

          <div className="mt-5 space-y-4 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar text-left">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">Description</span>
              <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed font-normal">
                {selectedSkill?.description}
              </p>
            </div>

            {selectedSkill?.inputSchema && Object.keys(selectedSkill.inputSchema.properties || {}).length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">Input Parameters</span>
                <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-900/50 p-4.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 overflow-x-auto">
                  <pre className="whitespace-pre-wrap leading-relaxed font-mono">
                    {JSON.stringify(selectedSkill.inputSchema.properties, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => setSelectedSkill(null)}
              className="h-8 px-4 rounded-full text-xs font-medium border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all active:scale-[0.98]"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
