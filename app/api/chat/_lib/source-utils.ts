export function extractTitleFromMarkdown(markdown: string, fallback: string): string {
  if (!markdown) return fallback;
  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  return fallback;
}

export function getFriendlyTitleFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.replace('www.', '');
    const pathname = url.pathname.replace(/\/$/, '');
    if (!pathname || pathname === '') {
      return `${hostname} (Home)`;
    }
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    const cleanSegment = lastSegment
      .replace(/[-_]/g, ' ')
      .replace(/\.[a-zA-Z0-9]+$/, '')
      .replace(/\b\w/g, (character) => character.toUpperCase());
    return `${cleanSegment} - ${hostname}`;
  } catch {
    return urlString;
  }
}

