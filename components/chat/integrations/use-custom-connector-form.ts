"use client";

import { useRef, useState } from 'react';
import { db } from '@/lib/db';
import { useCustomToast } from '@/components/ui/custom-toast';
import { discoverOAuthMetadata } from '@/lib/mcp-oauth';

interface Options {
  triggerOAuthFlow: (provider: string, remoteUrl: string, customScopeOverride?: string) => Promise<void>;
  syncTools: (integrationId: string) => Promise<void>;
  closeDialog: () => void;
}

export function useCustomConnectorForm({ triggerOAuthFlow, syncTools, closeDialog }: Options) {
  const { showToast } = useCustomToast();

  // Custom Integration Form state
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customMode, setCustomMode] = useState<'auto' | 'direct' | 'proxy'>('auto');
  const [customAuthType, setCustomAuthType] = useState<'none' | 'apiKey' | 'oauth'>('none');
  const [customAccessToken, setCustomAccessToken] = useState('');
  const [customScopes, setCustomScopes] = useState('');

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
    setCustomScopes('');
    setDetectingAuth(false);
    setDetectedAuthResult(null);
    setIsConnecting(false);
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
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
          scope: customScopes || undefined,
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
        const scopesToRegister = customScopes;
        closeDialog();
        resetCustomForm();

        // Launch PKCE authorization flow immediately
        await triggerOAuthFlow(id, urlToRegister, scopesToRegister);
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

      closeDialog();
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


  return {
    customName, setCustomName,
    customUrl,
    customMode, setCustomMode,
    customAuthType, setCustomAuthType,
    customAccessToken, setCustomAccessToken,
    customScopes, setCustomScopes,
    detectingAuth, detectedAuthResult, isConnecting,
    handleUrlInput, resetCustomForm, handleRegisterCustom,
  };
}
