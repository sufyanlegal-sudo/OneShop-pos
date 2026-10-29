import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { ShopProvider } from '@/context/ShopContext';

export const metadata: Metadata = {
  title: 'OneShop POS | JK Developers Pakistan - ون شاپ پی او ایس',
  description: 'OneShop POS - Enterprise Bilingual POS & ERP System by JK Developers Pakistan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="rtl" className="h-full">
      <body className="h-full antialiased font-sans bg-slate-100 text-slate-900 selection:bg-emerald-500 selection:text-white">
        <LanguageProvider>
          <ShopProvider>
            {children}
          </ShopProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
