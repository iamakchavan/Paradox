'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, MCPIntegration } from '@/lib/db';
import { executeDirectTool, discoverDirectTools, preflightRefreshIntegrations } from '@/lib/mcp-client';
import { 
  Github, Calendar, Puzzle, RefreshCw, Trash2, Plus, 
  Check, AlertTriangle, Globe, Lock, Settings, ChevronRight, X, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomToast } from '@/components/ui/custom-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  discoverOAuthMetadata, 
  registerMcpClient, 
  generateCodeVerifier, 
  generateCodeChallenge 
} from '@/lib/mcp-oauth';

const PROVIDER_SCOPES: Record<string, string> = {
  github: 'repo',
  cal: 'EVENT_TYPE_READ EVENT_TYPE_WRITE BOOKING_READ BOOKING_WRITE SCHEDULE_READ SCHEDULE_WRITE APPS_READ APPS_WRITE PROFILE_READ PROFILE_WRITE ORG_BOOKING_READ TEAM_BOOKING_READ ORG_MEMBERSHIP_READ ORG_MEMBERSHIP_WRITE ORG_ROUTING_FORM_READ',
  notion: ''
};

const PROVIDER_TEMPLATES = [
  { id: 'github', name: 'GitHub', desc: 'Read code, search files, manage repos, and commit work.', icon: Github, type: 'oauth', url: 'https://mcp.github.com/mcp' },
  { id: 'notion', name: 'Notion', desc: 'Search and sync workspace pages, databases, and lists.', icon: Puzzle, type: 'oauth', url: 'https://mcp.notion.com/mcp' },
  { id: 'cal', name: 'Cal.com', desc: 'Read calendars, check availability, and schedule meetings.', icon: Calendar, type: 'oauth', url: 'https://mcp.cal.com/mcp' }
];

export function IntegrationsTab() {
  const { showToast } = useCustomToast();
  const integrations = useLiveQuery(() => db.mcpIntegrations.toArray()) || [];
  
  const [selectedIntegration, setSelectedIntegration] = useState<MCPIntegration | null>(null);
  const [isRegisteringCustom, setIsRegisteringCustom] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  // Custom Integration Form state
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customMode, setCustomMode] = useState<'auto' | 'direct' | 'proxy'>('auto');
  const [customAuthType, setCustomAuthType] = useState<'none' | 'oauth'>('none');
  const [customAccessToken, setCustomAccessToken] = useState('');

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
        clientId = await registerMcpClient(metadata.registration_endpoint, redirectUri, scope);
        localStorage.setItem(`mcp_oauth_client_${provider}`, clientId);
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

    try {
      const parsedUrl = new URL(customUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Endpoint must start with http:// or https://');
      }

      const id = customName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
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
      // Reset form
      setCustomName('');
      setCustomUrl('');
      setCustomMode('auto');
      setCustomAuthType('none');
      setCustomAccessToken('');

      await syncTools(id);
    } catch (err: any) {
      showToast({
        title: 'Registration Error',
        message: err.message || 'Invalid server URL structure.',
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

  return (
    <div className="h-full flex flex-col min-h-0 text-foreground font-sans">
      <AnimatePresence mode="wait">
        {!selectedIntegration && !isRegisteringCustom ? (
          /* List & Hub Main View */
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-7"
          >
            {/* Header / Intro */}
            <div className="p-5 rounded-2xl bg-linear-to-r from-cyan-500/10 via-blue-500/5 to-transparent border border-zinc-200/40 dark:border-zinc-800/40 shadow-3xs relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <div className="flex gap-4 relative z-10">
                <div className="p-3 bg-cyan-600/15 dark:bg-cyan-500/10 rounded-xl text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Puzzle className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight mb-1">MCP App Integrations Hub</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                    Connect Paradox to external workspace tools using the Model Context Protocol (MCP). Active apps expose real-time context and native tools directly to the AI model.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Integrations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase">
                  Connected Connections ({integrations.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRegisteringCustom(true)}
                  className="h-8 gap-1.5 px-3 rounded-full text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 border border-zinc-200/50 dark:border-zinc-800/50 text-cyan-600 dark:text-cyan-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Custom SSE
                </Button>
              </div>

              {integrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-9 bg-zinc-50/10 dark:bg-zinc-950/20 border border-dashed border-zinc-200/50 dark:border-zinc-850 rounded-2xl">
                  <Puzzle className="w-9 h-9 text-muted-foreground/45 mb-3" strokeWidth={1.5} />
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    No apps connected. Connect one of the accounts below to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {integrations.map((app) => {
                    const iconMap: Record<string, any> = { github: Github, cal: Calendar };
                    const AppIcon = iconMap[app.id] || Puzzle;
                    
                    // Card theme logic based on provider
                    let themeClass = "from-cyan-500/5 to-blue-600/5 hover:border-cyan-500/30";
                    let iconBg = "bg-zinc-200/40 dark:bg-zinc-900/60";
                    if (app.id === 'github') {
                      themeClass = "from-zinc-900/10 to-zinc-900/5 dark:from-zinc-950/25 dark:to-zinc-950/10 hover:border-zinc-500/30";
                      iconBg = "bg-zinc-900/10 dark:bg-zinc-900/60";
                    } else if (app.id === 'cal') {
                      themeClass = "from-orange-500/5 to-amber-600/5 hover:border-orange-500/30";
                      iconBg = "bg-orange-500/10 dark:bg-orange-500/20";
                    } else if (app.id === 'notion') {
                      themeClass = "from-slate-500/5 to-zinc-650/5 hover:border-slate-500/30";
                      iconBg = "bg-slate-500/10 dark:bg-slate-500/20";
                    }

                    const isOnline = app.status === 'connected';

                    return (
                      <div 
                        key={app.id}
                        onClick={() => setSelectedIntegration(app)}
                        className={cn(
                          "group flex flex-col p-4 bg-linear-to-b border border-zinc-200/45 dark:border-zinc-850 hover:shadow-xs rounded-2xl transition-all duration-200 cursor-pointer hover:scale-[1.015] relative overflow-hidden",
                          themeClass
                        )}
                      >
                        <div className="flex items-center gap-3.5 mb-3">
                          <div className={cn("p-2.5 rounded-xl text-foreground", iconBg)}>
                            <AppIcon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold truncate leading-none mb-1.5">{app.name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0 relative flex",
                                isOnline ? "bg-emerald-500" : "bg-rose-500"
                              )}>
                                {isOnline && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                )}
                              </span>
                              <span className="text-[10px] font-semibold text-muted-foreground capitalize">{app.status}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/45 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <div className="text-[10px] text-muted-foreground/80 font-medium">
                          {app.cachedTools?.length || 0} tools available • Strategy: <span className="capitalize font-semibold">{app.connectionMode}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Provider Directory Marketplace */}
            <div className="border-t border-zinc-200/20 dark:border-zinc-800/40 pt-6">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase">
                  App Marketplace Directory
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PROVIDER_TEMPLATES.map((tmpl) => {
                  const TmplIcon = tmpl.icon;
                  const isConnected = integrations.some(i => i.id === tmpl.id);

                  let btnClass = "bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-800 dark:hover:bg-cyan-700";
                  let cardTheme = "hover:border-zinc-350 dark:hover:border-zinc-800";
                  if (tmpl.id === 'github') {
                    btnClass = "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-700/30";
                  } else if (tmpl.id === 'cal') {
                    btnClass = "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xs border-orange-500/20";
                    cardTheme = "hover:border-orange-500/20";
                  } else if (tmpl.id === 'notion') {
                    btnClass = "bg-slate-700 hover:bg-slate-800 text-white border border-slate-600/30";
                    cardTheme = "hover:border-slate-500/20";
                  }

                  return (
                    <div 
                      key={tmpl.id}
                      className={cn(
                        "flex flex-col justify-between p-4 bg-zinc-50/15 dark:bg-zinc-950/15 border border-zinc-200/35 dark:border-zinc-850 rounded-2xl transition-all duration-200 hover:scale-[1.005]",
                        cardTheme
                      )}
                    >
                      <div className="flex gap-3.5 mb-4">
                        <div className="p-2.5 bg-zinc-200/25 dark:bg-zinc-900/40 rounded-xl text-foreground">
                          <TmplIcon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold leading-none mb-1.5">{tmpl.name}</span>
                          <span className="text-[10px] font-medium leading-normal text-muted-foreground line-clamp-2">
                            {tmpl.desc}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isConnected}
                        onClick={() => handleConnectOAuth(tmpl.id, tmpl.url)}
                        className={cn(
                          "w-full h-8 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all active:scale-[0.98]",
                          isConnected 
                            ? "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground border border-zinc-200/20 dark:border-zinc-800/25" 
                            : btnClass
                        )}
                      >
                        {isConnected ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Connected
                          </span>
                        ) : 'Connect Account'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : isRegisteringCustom ? (
          /* Custom SSE registration form */
          <motion.form 
            key="custom-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleRegisterCustom}
            className="flex-1 space-y-5 pr-1"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/20 dark:border-zinc-800/40">
              <span className="text-sm font-bold">Register Custom SSE Server</span>
              <button 
                type="button" 
                onClick={() => setIsRegisteringCustom(false)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Server Name</label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Memory Server"
                  className="h-9.5 px-3.5 rounded-xl text-xs border-zinc-200/70 dark:border-zinc-800 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">SSE Endpoint URL</label>
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://mcp.example.com/sse"
                  className="h-9.5 px-3.5 rounded-xl text-xs border-zinc-200/70 dark:border-zinc-800 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Execution Strategy</label>
                  <select
                    value={customMode}
                    onChange={(e) => setCustomMode(e.target.value as any)}
                    className="h-9.5 px-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-background text-xs select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    <option value="auto">Auto Checks</option>
                    <option value="direct">Direct Browser Only</option>
                    <option value="proxy">Proxy via Next Server</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Auth Type</label>
                  <select
                    value={customAuthType}
                    onChange={(e) => setCustomAuthType(e.target.value as any)}
                    className="h-9.5 px-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-background text-xs select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    <option value="none">None / Public</option>
                    <option value="oauth">Stateless Bearer Access Token</option>
                  </select>
                </div>
              </div>

              {customAuthType === 'oauth' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Bearer Access Token</label>
                  <Input
                    type="password"
                    value={customAccessToken}
                    onChange={(e) => setCustomAccessToken(e.target.value)}
                    placeholder="Enter authentication bearer token"
                    className="h-9.5 px-3.5 rounded-xl text-xs border-zinc-200/70 dark:border-zinc-800 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200/20 dark:border-zinc-800/40">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsRegisteringCustom(false)}
                className="h-9.5 px-4 rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9.5 px-5 rounded-full text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-800/90 dark:hover:bg-cyan-700/90 shadow-xs cursor-pointer"
              >
                Connect App
              </Button>
            </div>
          </motion.form>
        ) : selectedIntegration ? (
          /* Detailed Connection View */
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col min-h-0 space-y-5 pr-1"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/25 dark:border-zinc-800/40 shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedIntegration(null)}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer mr-1"
                >
                  ← Back
                </button>
                <span className="text-sm font-bold">{selectedIntegration.name}</span>
              </div>
              
              {/* Enabled toggle pill */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{selectedIntegration.isEnabled ? 'Active' : 'Paused'}</span>
                <button
                  onClick={() => handleToggleEnabled(selectedIntegration.id, selectedIntegration.isEnabled)}
                  className={cn(
                    "relative inline-flex h-5 w-9.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    selectedIntegration.isEnabled ? "bg-cyan-600 dark:bg-cyan-500" : "bg-zinc-200 dark:bg-zinc-800"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out",
                      selectedIntegration.isEnabled ? "translate-x-4.5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 no-scrollbar">
              {/* Endpoint Address Card */}
              <div className="flex flex-col gap-2 p-4 bg-zinc-50/15 dark:bg-zinc-950/25 border border-zinc-200/35 dark:border-zinc-850 rounded-2xl text-[11px]">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/60 uppercase">
                  <span>Server SSE Endpoint URL</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full relative flex",
                      selectedIntegration.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                    )}>
                      {selectedIntegration.status === 'connected' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">{selectedIntegration.status}</span>
                  </div>
                </div>
                <div className="text-foreground font-mono truncate leading-normal select-all bg-black/5 dark:bg-white/5 px-2 py-1.5 rounded-lg border border-zinc-200/10">{selectedIntegration.url}</div>
              </div>

              {/* Execution Strategy */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase">
                  CORS Execution Strategy
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['auto', 'direct', 'proxy'] as const).map((mode) => {
                    const active = selectedIntegration.connectionMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => handleUpdateMode(selectedIntegration.id, mode)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2.5 border rounded-xl cursor-pointer text-center select-none transition-all duration-200",
                          active
                            ? "bg-cyan-500/10 dark:bg-cyan-500/10 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-bold scale-[1.02] shadow-3xs"
                            : "bg-zinc-50/15 dark:bg-zinc-950/15 border-zinc-200/40 dark:border-zinc-800/40 hover:bg-zinc-100/5 hover:dark:bg-zinc-900/5 hover:border-zinc-200 dark:hover:border-zinc-800 text-muted-foreground/80 font-medium"
                        )}
                      >
                        <span className="text-xs capitalize">{mode}</span>
                        {mode === 'auto' && <span className="text-[7.5px] mt-0.5 opacity-80">Preflight Check</span>}
                        {mode === 'direct' && <span className="text-[7.5px] mt-0.5 opacity-80">Local Client</span>}
                        {mode === 'proxy' && <span className="text-[7.5px] mt-0.5 opacity-80">API Gateway</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isSyncing[selectedIntegration.id]}
                  onClick={() => syncTools(selectedIntegration.id)}
                  className="flex-1 h-8.5 rounded-xl text-xs font-bold bg-zinc-50 hover:bg-zinc-100 text-foreground dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800/50 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5 shrink-0", isSyncing[selectedIntegration.id] && 'animate-spin')} />
                  {isSyncing[selectedIntegration.id] ? 'Syncing...' : 'Sync Schema'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDeleteIntegration(selectedIntegration.id)}
                  className="flex-1 h-8.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Disconnect
                </Button>
              </div>

              {/* Tool Listing */}
              <div className="space-y-3 border-t border-zinc-200/20 dark:border-zinc-800/40 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase">
                    Available Tools ({selectedIntegration.cachedTools?.length || 0})
                  </span>
                </div>
                
                {selectedIntegration.cachedTools.length === 0 ? (
                  <div className="flex items-start gap-2.5 p-3.5 bg-zinc-50/10 dark:bg-zinc-950/15 border border-dashed border-zinc-200/40 dark:border-zinc-800/40 rounded-xl text-[10px] text-muted-foreground">
                    <Info className="w-4 h-4 shrink-0 text-muted-foreground/60 mt-0.5" />
                    <span className="leading-normal">No tools synchronized yet. Click **Sync Schema** above to discover available endpoints.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedIntegration.cachedTools.map((tool) => (
                      <div 
                        key={tool.namespacedName}
                        className="flex flex-col p-3.5 bg-zinc-50/15 dark:bg-zinc-950/20 border border-zinc-200/20 dark:border-zinc-850/60 rounded-xl hover:border-zinc-200/50 dark:hover:border-zinc-800/50 transition-all duration-150"
                      >
                        <div className="flex items-center justify-between font-bold text-foreground mb-1.5 gap-2">
                          <span className="font-mono text-[11px] truncate">{tool.name}</span>
                          <span className="text-[8px] bg-zinc-200/60 dark:bg-zinc-900/90 text-muted-foreground px-1.5 py-0.5 rounded-full font-mono shrink-0 border border-zinc-200/10">
                            {tool.namespacedName}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-muted-foreground font-medium leading-relaxed">
                          {tool.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
