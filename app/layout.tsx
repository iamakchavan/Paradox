import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TooltipProvider } from '@/components/ui/tooltip';
import { CustomToastProvider } from '@/components/ui/custom-toast';
import { Space_Mono, JetBrains_Mono } from 'next/font/google';

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5ef' },
    { media: '(prefers-color-scheme: dark)',  color: '#09090b' },
  ],
};

export const metadata: Metadata = {
  title: 'Paradox',
  description: 'Minimilastic AI chat interface',
  icons: {
    icon: [
      {
        url: '/chaticons/favicon-32.png',
        sizes: '32x32',
        type: 'image/png'
      }
    ],
    shortcut: [
      {
        url: '/chaticons/favicon-32.png',
        type: 'image/png'
      }
    ],
    apple: [
      {
        url: '/chaticons/apple-icon-180.png',
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
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/css?f[]=sentient@500,600,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap"
        />
      </head>
      <body className={`${spaceMono.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <CustomToastProvider>
              {children}
              <Analytics />
              <SpeedInsights />
            </CustomToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}