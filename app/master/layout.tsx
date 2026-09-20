import type { Metadata, Viewport } from 'next';
import { MasterPwaInstallPrompt } from '@/components/master/MasterPwaInstallPrompt';

export const metadata: Metadata = {
  title: 'Vitriniza Master | Painel de Gestão e Administração',
  description: 'Aplicativo de administração central e gestão global da plataforma Vitriniza.',
  manifest: '/manifest-master.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vitriniza Master',
  },
  icons: {
    icon: '/icon-master-192.png',
    shortcut: '/icon-master-192.png',
    apple: '/icon-master-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0E3B43',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/manifest-master.json" />
      <link rel="apple-touch-icon" href="/icon-master-192.png" />
      {children}
      <MasterPwaInstallPrompt />
    </>
  );
}
