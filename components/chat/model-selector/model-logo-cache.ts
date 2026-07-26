import type { ModelConfig } from '@/lib/models';
import { DISPLAY_BRANDS, getProviderLogoUrl } from './model-branding';

const retainedImages = new Map<string, HTMLImageElement>();
const pendingLoads = new Map<string, Promise<void>>();

function loadAndDecodeLogo(url: string): Promise<void> {
  const existing = pendingLoads.get(url);
  if (existing) return existing;
  if (typeof window === 'undefined') return Promise.resolve();

  const image = new Image();
  image.decoding = 'async';
  retainedImages.set(url, image);

  const pending = new Promise<void>((resolve) => {
    const settle = () => resolve();
    image.addEventListener('load', settle, { once: true });
    image.addEventListener('error', settle, { once: true });
    image.src = url;

    if (image.complete) settle();
  })
    .then(async () => {
      try {
        await image.decode();
      } catch {
        // A failed decode still leaves the normal <img> error/fallback path intact.
      }
    });

  pendingLoads.set(url, pending);
  return pending;
}

function getSelectorLogoUrls(models: readonly ModelConfig[], isDark: boolean): string[] {
  const urls = new Set<string>();

  for (const brand of DISPLAY_BRANDS) {
    const url = getProviderLogoUrl(brand, undefined, isDark);
    if (url) urls.add(url);
  }

  for (const model of models) {
    const url = getProviderLogoUrl(model.provider, model.id, isDark);
    if (url) urls.add(url);
  }

  return Array.from(urls);
}

export async function warmModelSelectorLogoCache(
  models: readonly ModelConfig[],
  isDark: boolean,
): Promise<void> {
  await Promise.all(getSelectorLogoUrls(models, isDark).map(loadAndDecodeLogo));
}
