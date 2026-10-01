import type { Metadata } from 'next';
import Script from 'next/script';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { ClientChrome } from '@/components/layout/ClientChrome';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrmenswear.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VR Men's Wear — Premium Fashion, Casual & 3-in-1 Combo Store",
    template: "%s | VR Men's Wear",
  },
  description:
    "Official VR Men's Wear online flagship store. Premium cotton shirts, jeans, tailored trousers, ethnic kurtas & 3-in-1 combo packs with dynamic Flipkart-style size pricing, Razorpay checkout, and express delivery.",
  keywords: [
    "VR Men's Wear",
    "VR Mens Wear",
    "Men's clothing store Chennai",
    'Pure cotton shirts for men',
    '3 in 1 combo pack shirts',
    'Stretch chinos and trousers',
    'Mens ethnic kurtas',
    'Menswear online buy India',
  ],
  authors: [{ name: "VR MEN'S WEAR" }],
  creator: "VR Men's Wear",
  publisher: "VR MEN'S WEAR",
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: "VR Men's Wear — Premium Fashion & 3-in-1 Value Combos",
    description:
      'Curated menswear crafted for the modern gentleman with dynamic sizing, premium fabrics, and express doorstep delivery.',
    url: siteUrl,
    siteName: "VR Men's Wear",
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "VR Men's Wear — Premium Men's Apparel",
    description:
      'Discover breathable pure cotton shirts, stretch chinos, modern kurtas, and high-value 3-in-1 combo packs.',
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const,
  themeColor: '#0B0F19',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${plusJakartaSans.variable} antialiased bg-slate-950 text-slate-100`} suppressHydrationWarning>
        <StoreProvider>
          <ClientChrome>{children}</ClientChrome>
        </StoreProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.addEventListener('error', function(e) {
                  try {
                    var msg = (e && e.message) || '';
                    var target = e && e.target;
                    var isChunkErr = typeof msg === 'string' && (
                      msg.indexOf('Loading chunk') !== -1 ||
                      msg.indexOf('ChunkLoadError') !== -1 ||
                      msg.indexOf('Failed to fetch dynamically imported module') !== -1
                    );

                    if (isChunkErr) {
                      var now = Date.now();
                      var lastReload = parseInt(sessionStorage.getItem('vr_last_chunk_reload') || '0', 10);
                      if (now - lastReload > 30000) {
                        sessionStorage.setItem('vr_last_chunk_reload', String(now));
                        console.warn('New deployment detected — reloading once for latest bundle...');
                        window.location.reload();
                      }
                    }
                  } catch (err) {}
                }, true);
              })();
            `,
          }}
        />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <Script
          id="unregister-sw"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
