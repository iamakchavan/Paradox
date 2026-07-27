'use client';

import { useEffect } from 'react';
import { ensurePersistentBrowserStorage } from '@/lib/storage/browser-storage-durability';

export function StorageDurabilityBootstrap() {
  useEffect(() => {
    void ensurePersistentBrowserStorage();
  }, []);

  return null;
}
