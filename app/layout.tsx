import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { PwaInstallPrompt } from '@/components/ui/PwaInstallPrompt';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Vitriniza | O comércio perto de você - Vitrine Digital Inteligente',
  description: 'Descubra quem empreende perto de você. Encontre comércios, restaurantes, serviços, produtos e promoções no seu bairro e fale direto pelo WhatsApp.',
  keywords: [
    'comércio local',
    'vitrine digital',
    'bairro',
    'restaurantes',
    'serviços',
    'Guaianases',
    'São Paulo',
    'promoções',
    'WhatsApp comércio',
    'Vitriniza',
  ],
  authors: [{ name: 'Vitriniza' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    shortcut: '/icon-192.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Vitriniza | O comércio perto de você',
    description: 'Encontre comércios locais, serviços, promoções e entre em contato direto pelo WhatsApp.',
    url: SITE_URL,
    siteName: 'Vitriniza',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Vitriniza - O comércio perto de você',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vitriniza | O comércio perto de você',
    description: 'A vitrine digital inteligente do seu bairro.',
  },
};

export const viewport: Viewport = {
  themeColor: '#E36845',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8F6F0] text-[#0E3B43] antialiased">
        <Navbar />
        <main className="flex-1 pb-mobile-nav lg:pb-0">{children}</main>
        <Footer />
        <BottomNav />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
