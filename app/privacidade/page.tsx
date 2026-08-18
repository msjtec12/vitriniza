'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ChevronRight } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-2 text-xs text-[#6E7771]">
        <Link href="/" className="hover:text-[#E85D2A]">Início</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-[#1C1C1C]">Política de Privacidade & LGPD</span>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E5DE] card-shadow space-y-6 text-sm text-[#2D312E] leading-relaxed">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F0E5DE]">
          <ShieldCheck className="w-8 h-8 text-[#194D3A]" />
          <div>
            <h1 className="text-2xl font-black text-[#1C1C1C]">Política de Privacidade</h1>
            <p className="text-xs text-[#6E7771]">Conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1C1C1C]">1. Informações que Coletamos</h2>
          <p>
            A <strong>Vitriniza</strong> tem como prioridade a privacidade e a proteção dos dados de seus usuários e comerciantes. Coletamos apenas as informações essenciais para o funcionamento da vitrine digital:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Dados comerciais públicos fornecidos pelo comerciante (nome fantasia, telefone/WhatsApp, endereço, horários, fotos e produtos);</li>
            <li>Dados anônimos de navegação e métricas agregadas (visualizações de página, cliques no botão do WhatsApp);</li>
            <li>Localização geográfica aproximada mediante autorização do usuário no navegador para o recurso "Perto de Mim".</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1C1C1C]">2. Como Utilizamos seus Dados</h2>
          <p>
            Os dados coletados destinam-se exclusivamente a conectar consumidores a comércios locais e gerar estatísticas para que os comerciantes acompanhem a visibilidade de seus estabelecimentos. Não vendemos dados a terceiros.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1C1C1C]">3. Contato do Encarregado de Dados</h2>
          <p>
            Para exercer seus direitos de acesso, retificação ou exclusão de dados, entre em contato pelo e-mail: <strong>privacidade@vitriniza.com.br</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
