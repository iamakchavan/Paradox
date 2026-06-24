import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Paradox AI',
    short_name: 'Paradox',
    description: 'Minimalistic AI chat interface',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0891b2', // cyan-600
    icons: [
      {
        src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
