export type BrowserStorageDurability =
  | { status: 'persistent' }
  | { status: 'best-effort' }
  | { status: 'unsupported' };

let durabilityRequest: Promise<BrowserStorageDurability> | null = null;

async function requestBrowserStorageDurability(): Promise<BrowserStorageDurability> {
  if (typeof navigator === 'undefined') {
    return { status: 'unsupported' };
  }

  const storage = navigator.storage;
  if (!storage?.persisted || !storage.persist) {
    return { status: 'unsupported' };
  }

  try {
    if (await storage.persisted()) {
      return { status: 'persistent' };
    }

    return {
      status: (await storage.persist()) ? 'persistent' : 'best-effort',
    };
  } catch {
    // Persistence is an optional browser capability. Storage remains usable
    // when a browser blocks or rejects the request.
    return { status: 'best-effort' };
  }
}

export function ensurePersistentBrowserStorage(): Promise<BrowserStorageDurability> {
  durabilityRequest ??= requestBrowserStorageDurability();
  return durabilityRequest;
}
