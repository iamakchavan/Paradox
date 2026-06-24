import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Paradox',
    short_name: 'Paradox',
    description: 'Minimalistic AI chat interface',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#f7f5ef',
    theme_color: '#f7f5ef',
    icons: [
      {
        src: '/chaticons/paradox-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/chaticons/paradox-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
