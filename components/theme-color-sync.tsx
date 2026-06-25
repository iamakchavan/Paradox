"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = resolvedTheme === "dark" ? "#0b0c10" : "#f7f5ef";
  }, [resolvedTheme]);
  return null;
}
