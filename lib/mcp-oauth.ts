import { db } from './db';

function dec2hex(dec: number) {
  return dec.toString(16).padStart(2, "0");
}

export function generateCodeVerifier() {
  const array = new Uint32Array(56 / 2);
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
      registration_endpoint: data.registration_endpoint
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
): Promise<string> {
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

    return data.client_id;
  } catch (err: any) {
    console.error('[OAuth Registration Error]:', err);
    throw new Error(`Failed to dynamically register OAuth client: ${err.message}`);
  }
}
