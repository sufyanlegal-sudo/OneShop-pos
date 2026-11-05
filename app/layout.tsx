import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { ShopProvider } from '@/context/ShopContext';

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'One Shop POS - Best Cloud POS Software in Pakistan | ون شاپ پی او ایس',
  description: 'One Shop POS is a secure cloud-based point of sale system for supermarkets, retail shops, and businesses in Pakistan, developed by JK Developers Pakistan.',
  keywords: [
    'One Shop POS',
    'POS Software Pakistan',
    'Best Cloud POS Software in Pakistan',
    'Supermarket POS Pakistan',
    'Retail POS System Pakistan',
    'JK Developers Pakistan',
    'Best POS Software',
    'Bilingual POS System',
    'ون شاپ پی او ایس',
    'پوائنٹ آف سیل سافٹ ویئر',
    'کیش کاؤنٹر سافٹ ویئر',
    'ادھار کھاتہ سافٹ ویئر',
  ],
  authors: [{ name: 'JK Developers Pakistan', url: 'https://one-shop-pos.vercel.app' }],
  creator: 'JK Developers Pakistan',
  publisher: 'JK Developers Pakistan',
  metadataBase: new URL('https://one-shop-pos.vercel.app'),
  alternates: {
    canonical: 'https://one-shop-pos.vercel.app',
  },
  openGraph: {
    title: 'One Shop POS - Best Cloud POS Software in Pakistan | ون شاپ پی او ایس',
    description: 'One Shop POS is a secure cloud-based point of sale system for supermarkets, retail shops, and businesses in Pakistan, developed by JK Developers Pakistan.',
    url: 'https://one-shop-pos.vercel.app',
    siteName: 'One Shop POS',
    locale: 'ur_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'One Shop POS - Best Cloud POS Software in Pakistan | ون شاپ پی او ایس',
    description: 'One Shop POS is a secure cloud-based point of sale system for supermarkets, retail shops, and businesses in Pakistan, developed by JK Developers Pakistan.',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'q6oMUpMYb30YKi5dd_34e9jQdfc9ir7glULvvhdUkxY',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'One Shop POS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="rtl" className="h-full">
      <head>
        <title>One Shop POS - Best Cloud POS Software in Pakistan | ون شاپ پی او ایس</title>
        <meta name="description" content="One Shop POS is a secure cloud-based point of sale system for supermarkets, retail shops, and businesses in Pakistan, developed by JK Developers Pakistan." />
        <meta name="keywords" content="One Shop POS, POS Software Pakistan, Best Cloud POS Software in Pakistan, Supermarket POS Pakistan, Retail POS System Pakistan, JK Developers Pakistan, ون شاپ پی او ایس" />
        <meta name="google-site-verification" content="q6oMUpMYb30YKi5dd_34e9jQdfc9ir7glULvvhdUkxY" />
        <link rel="canonical" href="https://one-shop-pos.vercel.app" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body className="h-full antialiased font-sans bg-slate-100 text-slate-900 selection:bg-emerald-500 selection:text-white">
        <LanguageProvider>
          <ShopProvider>
            {children}
          </ShopProvider>
        </LanguageProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (let reg of regs) {
                    reg.update();
                  }
                });
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js?v=4').catch(function(err) {
                    console.log('SW registration note:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
