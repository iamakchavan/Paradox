export function getCleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return (parsed.hostname + parsed.pathname).replace(/\/$/, '').toLowerCase();
  } catch {
    return url.trim().replace(/\/$/, '').toLowerCase();
  }
}

export function extractSiteName(title: string): string | null {
  if (!title) return null;
  const separators = [' | ', ' – ', ' — ', ' - '];
  for (const separator of separators) {
    const index = title.lastIndexOf(separator);
    if (index !== -1) {
      const candidate = title.substring(index + separator.length).trim();
      if (
        candidate.length >= 2
        && candidate.length <= 25
        && !candidate.includes(',')
        && !/^\d+$/.test(candidate)
      ) {
        return candidate;
      }
    }
  }
  return null;
}

