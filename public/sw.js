// Service Worker for Paradox PWA installation
// IMPORTANT: We deliberately do NOT intercept streaming API routes.
// Proxying fetch() through a SW kills long-running SSE/streaming responses
// on mobile browsers (iOS Safari terminates SWs after ~30s of inactivity,
// breaking /api/chat and /api/chat/research mid-stream).

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pass API routes and any streaming endpoints directly to the network —
  // never proxy them through the service worker.
  if (
    url.pathname.startsWith('/api/') ||
    event.request.headers.get('accept') === 'text/event-stream'
  ) {
    return; // Let the browser handle it natively — no respondWith()
  }

  // For all other requests (navigation, assets, etc.) use a simple
  // network-first pass-through. No caching needed for a chat app.
  event.respondWith(fetch(event.request));
});
