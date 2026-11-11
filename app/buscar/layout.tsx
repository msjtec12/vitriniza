import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buscar comércios, serviços e locais úteis | Vitriniza',
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
