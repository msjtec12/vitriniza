import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Vitriniza | Comércios e serviços na Zona Leste de São Paulo',
  description: 'Encontre comércios, serviços e locais úteis em Guaianases e nos bairros cadastrados da Zona Leste. Fale com os negócios diretamente pelo WhatsApp.',
  alternates: { canonical: `${SITE_URL}/` },
};

export default function HomePage() {
  return <HomePageClient />;
}
