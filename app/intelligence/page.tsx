import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Local Intelligence | Vitriniza',
  description: 'Central de diagnóstico e evolução da presença digital dos negócios no Vitriniza.',
  robots: { index: false, follow: false },
};

type Check = { title: string; detail: string; status: 'configurado' | 'verificar' };
const checks: Check[] = [
  { title: 'URL canônica', detail: 'A URL principal é configurada por NEXT_PUBLIC_SITE_URL.', status: 'configurado' },
  { title: 'Páginas públicas', detail: 'Validar metadados, sitemap e dados estruturados de cada estabelecimento.', status: 'verificar' },
  { title: 'Search Console', detail: 'Conectar a propriedade com OAuth antes de exibir métricas verificadas.', status: 'verificar' },
  { title: 'Perfil da Empresa no Google', detail: 'Acesso depende de autorização da empresa e disponibilidade da API.', status: 'verificar' },
  { title: 'Conversões', detail: 'Validar eventos de WhatsApp, telefone e rotas, evitando contagens duplicadas.', status: 'verificar' },
];

export default function LocalIntelligencePage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#C45A3C]">Vitriniza · Konnexy</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0E3B43] sm:text-4xl">Local Intelligence</h1>
        <p className="mt-3 max-w-3xl text-base text-[#335C61]">
          Central inicial de diagnóstico de presença digital. Nenhuma métrica é simulada ou apresentada como dado oficial.
          As integrações serão liberadas após autorização e validação de coleta.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#0E3B43]/15 bg-white p-5">
          <p className="text-sm text-[#335C61]">Domínio configurado</p>
          <p className="mt-2 break-all font-semibold text-[#0E3B43]">{SITE_URL}</p>
        </div>
        <div className="rounded-2xl border border-[#0E3B43]/15 bg-white p-5">
          <p className="text-sm text-[#335C61]">Dados oficiais conectados</p>
          <p className="mt-2 text-xl font-semibold text-[#0E3B43]">Não verificados</p>
        </div>
        <div className="rounded-2xl border border-[#0E3B43]/15 bg-white p-5">
          <p className="text-sm text-[#335C61]">Resultados comerciais</p>
          <p className="mt-2 text-xl font-semibold text-[#0E3B43]">Aguardando medição</p>
        </div>
      </div>
      <h2 className="mb-4 mt-10 text-xl font-bold text-[#0E3B43]">Checklist de implantação</h2>
      <ul className="space-y-3">
        {checks.map((check) => (
          <li key={check.title} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#0E3B43]/15 bg-white p-4">
            <div>
              <h3 className="font-semibold text-[#0E3B43]">{check.title}</h3>
              <p className="mt-1 text-sm text-[#335C61]">{check.detail}</p>
            </div>
            <span className="rounded-full bg-[#F8F6F0] px-3 py-1 text-xs font-semibold text-[#0E3B43]">{check.status === 'configurado' ? 'Estrutura identificada' : 'Pendente de validação'}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="rounded-xl bg-[#0E3B43] px-5 py-3 text-sm font-semibold text-white">Explorar Vitriniza</Link>
        <Link href="/master" className="rounded-xl border border-[#0E3B43]/20 px-5 py-3 text-sm font-semibold text-[#0E3B43]">Administração</Link>
      </div>
      <p className="mt-6 text-xs text-[#335C61]">Este módulo é uma base de interface. Não substitui a autorização e o isolamento multiempresa exigidos para dados privados.</p>
    </section>
  );
}
