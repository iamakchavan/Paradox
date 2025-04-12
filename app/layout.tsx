import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: 'Paradox',
  description: 'Minimilastic AI chat interface',
  icons: {
    icon: [
      {
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png',
        sizes: '32x32',
        type: 'image/png'
      }
    ],
    shortcut: [
      {
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png',
        type: 'image/png'
      }
    ],
    apple: [
      {
        url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Kelly+Slab&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:wght@400;500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap"
        />
      </head>
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}