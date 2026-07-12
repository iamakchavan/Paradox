import { db } from './db';

function dec2hex(dec: number) {
  return dec.toString(16).padStart(2, "0");
}

export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join("");
}

export async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(a: ArrayBuffer) {
  let str = "";
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function generateCodeChallenge(v: string) {
  const hashed = await sha256(v);
  return base64urlencode(hashed);
}

export interface OAuthMetadata {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
}

export interface RegisteredMcpClient {
  clientId: string;
  clientSecret?: string;
  scope?: string;
}

function normalizeScope(value: unknown): string | undefined {
  const scopes = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\s,]+/)
      : [];
  const normalized = Array.from(new Set(
    scopes.filter((scope): scope is string => typeof scope === 'string' && scope.length > 0)
  ));
  return normalized.length > 0 ? normalized.join(' ') : undefined;
}

/**
 * Intersect a requested scope string with server-advertised scopes.
 * If the server does not advertise scopes_supported, do NOT invent a full
 * provider scope list for hosted MCP — return undefined so authorize can omit
 * scope and let the authorization server use the client's registered defaults.
 */
export function resolveSupportedOAuthScope(
  requestedScope: string | undefined,
  supportedScopes: string[] | undefined,
  options?: { allowUnlistedRequest?: boolean }
): string | undefined {
  const normalizedRequested = normalizeScope(requestedScope);
  if (!normalizedRequested) return undefined;

  // No advertisement: only keep the request when explicitly allowed (custom connectors).
  if (!supportedScopes || supportedScopes.length === 0) {
    return options?.allowUnlistedRequest ? normalizedRequested : undefined;
  }

  const supported = new Set(supportedScopes);
  const requested = normalizedRequested.split(' ');
  const accepted = requested.filter(scope => supported.has(scope));
  return accepted.length > 0 ? accepted.join(' ') : undefined;
}

/** Prefer registration-response scope fields over client-requested lists. */
export function scopeFromRegistrationResponse(data: Record<string, unknown>): string | undefined {
  return (
    normalizeScope(data.scope)
    || normalizeScope(data.scopes)
    || normalizeScope((data as { scope_granted?: unknown }).scope_granted)
  );
}

/**
 * Fetches OAuth metadata from the remote MCP server using standard RFC 8414 discovery.
 */
export async function discoverOAuthMetadata(serverUrl: string): Promise<OAuthMetadata | null> {
  try {
    const res = await fetch('/api/mcp/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'discover-oauth',
        url: serverUrl
      })
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data.authorization_endpoint || !data.token_endpoint) {
      return null;
    }

    return {
      authorization_endpoint: data.authorization_endpoint,
      token_endpoint: data.token_endpoint,
      registration_endpoint: data.registration_endpoint,
      scopes_supported: Array.isArray(data.scopes_supported)
        ? data.scopes_supported.filter((scope: unknown): scope is string => typeof scope === 'string')
        : undefined
    };
  } catch (err: any) {
    console.warn('[OAuth Discovery Info]: Remote server does not support OAuth.', err.message || err);
    return null;
  }
}

/**
 * Performs dynamic client registration (RFC 7591) with the remote MCP server if required.
 */
export async function registerMcpClient(
  registrationUrl: string,
  redirectUri: string,
  scope?: string
): Promise<RegisteredMcpClient> {
  try {
    const res = await fetch('/api/mcp/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register-oauth',
        registrationUrl,
        redirectUri,
        scope
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Dynamic client registration failed with status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.client_id) {
      throw new Error('Server registration response missing client_id.');
    }

    return {
      clientId: data.client_id,
      clientSecret: data.client_secret,
      // Only trust scopes the registration server actually granted/returned.
      // Never assume the requested scope was accepted.
      scope: scopeFromRegistrationResponse(data as Record<string, unknown>),
    };
  } catch (err: any) {
    console.error('[OAuth Registration Error]:', err);
    throw new Error(`Failed to dynamically register OAuth client: ${err.message}`);
  }
}
