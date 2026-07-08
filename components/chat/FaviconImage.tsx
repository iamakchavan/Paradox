"use client";

import { memo, useEffect, useState } from "react";
import { Globe } from "lucide-react";

import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const memoryFaviconCache = new Map<string, string>();
const pendingFavicons = new Map<string, Promise<string | null>>();

const getFavicon = (domain: string): Promise<string | null> => {
  const memCached = memoryFaviconCache.get(domain);
  if (memCached) {
    return Promise.resolve(memCached === "FAILED" ? null : memCached);
  }

  const pending = pendingFavicons.get(domain);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    try {
      const cached = await db.favicons.get(domain);
      if (cached && Date.now() - cached.createdAt < 7 * 24 * 60 * 60 * 1000) {
        memoryFaviconCache.set(domain, cached.dataUrl);
        return cached.dataUrl === "FAILED" ? null : cached.dataUrl;
      }

      const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      const proxiedFavicon = `/api/proxy-image?url=${encodeURIComponent(googleFavicon)}`;
      const res = await fetch(proxiedFavicon);

      if (!res.ok) {
        memoryFaviconCache.set(domain, "FAILED");
        await db.favicons.put({ domain, dataUrl: "FAILED", createdAt: Date.now() });
        return null;
      }

      const blob = await res.blob();
      const base64data = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });

      if (!base64data) {
        memoryFaviconCache.set(domain, "FAILED");
        await db.favicons.put({ domain, dataUrl: "FAILED", createdAt: Date.now() });
        return null;
      }

      memoryFaviconCache.set(domain, base64data);
      await db.favicons.put({ domain, dataUrl: base64data, createdAt: Date.now() });
      return base64data;
    } catch (err) {
      console.warn("Error fetching favicon for domain:", domain, err);
      memoryFaviconCache.set(domain, "FAILED");
      try {
        await db.favicons.put({ domain, dataUrl: "FAILED", createdAt: Date.now() });
      } catch (dbErr) {
        console.warn("Failed to cache failed favicon in IndexedDB:", dbErr);
      }
      return null;
    } finally {
      pendingFavicons.delete(domain);
    }
  })();

  pendingFavicons.set(domain, promise);
  return promise;
};

export const FaviconImage = memo(({ domain, className }: { domain: string; className?: string }) => {
  const [src, setSrc] = useState<string | null>(() => {
    const cached = memoryFaviconCache.get(domain);
    return cached && cached !== "FAILED" ? cached : null;
  });
  const [error, setError] = useState(() => memoryFaviconCache.get(domain) === "FAILED");

  useEffect(() => {
    const cached = memoryFaviconCache.get(domain);
    if (cached) {
      if (cached === "FAILED") {
        setError(true);
      } else {
        setSrc(cached);
        setError(false);
      }
      return;
    }

    let active = true;
    getFavicon(domain).then((data) => {
      if (!active) return;
      if (data) {
        setSrc(data);
        setError(false);
      } else {
        setError(true);
      }
    });

    return () => {
      active = false;
    };
  }, [domain]);

  if (error || !src) {
    return <Globe className={cn("text-muted-foreground/70", className)} />;
  }

  return (
    <img
      src={src}
      alt=""
      className={cn("object-contain shrink-0", className)}
      style={{ margin: 0 }}
      onError={() => setError(true)}
    />
  );
});

FaviconImage.displayName = "FaviconImage";
