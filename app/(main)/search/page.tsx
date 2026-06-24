"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Search is rendered inline in the chat page via SidebarContext.
// This route exists only as a redirect safety net.
export default function SearchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat');
  }, [router]);

  return null;
}
