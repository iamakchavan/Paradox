const REDIRECT_PATH_PATTERN = /\/(?:goto|redirect|url)\/?$/i;
const REDIRECT_TARGET_KEYS = ['url', 'q', 'target'] as const;
const RELATIVE_URL_BASE = 'https://paradox.invalid';

function parseAbsoluteHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function getRedirectTarget(url: URL): string | null {
  if (!REDIRECT_PATH_PATTERN.test(url.pathname)) return null;
  for (const key of REDIRECT_TARGET_KEYS) {
    const value = url.searchParams.get(key);
    if (!value) continue;
    const target = parseAbsoluteHttpUrl(value);
    if (target) {
      target.hash = '';
      return target.href;
    }
  }
  return null;
}

function isRedirectWrapper(url: URL): boolean {
  return REDIRECT_PATH_PATTERN.test(url.pathname)
    && REDIRECT_TARGET_KEYS.some(key => url.searchParams.has(key));
}

export function normalizeExternalSourceUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== 'string') return null;
  const value = rawUrl.trim().replace(/&amp;/gi, '&');
  if (!value) return null;

  const absolute = parseAbsoluteHttpUrl(value);
  if (absolute) {
    if (isRedirectWrapper(absolute)) {
      return getRedirectTarget(absolute);
    }
    absolute.hash = '';
    return absolute.href;
  }

  try {
    const relative = new URL(value, RELATIVE_URL_BASE);
    if (relative.origin !== RELATIVE_URL_BASE || !REDIRECT_PATH_PATTERN.test(relative.pathname)) {
      return null;
    }
    return getRedirectTarget(relative);
  } catch {
    return null;
  }
}

export function normalizeSourceCollection<T extends { url: string }>(
  sources: readonly T[],
): T[] {
  const normalized: T[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!source || typeof source.url !== 'string') continue;
    const url = normalizeExternalSourceUrl(source.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    normalized.push(url === source.url ? source : { ...source, url });
  }

  return normalized;
}

export function normalizeSourceUrls(urls: readonly string[]): string[] {
  return normalizeSourceCollection(urls.map(url => ({ url }))).map(source => source.url);
}
