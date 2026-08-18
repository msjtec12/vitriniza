'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-2 text-xs text-[#6E7771]">
        <Link href="/" className="hover:text-[#E85D2A]">Início</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-[#1C1C1C]">Termos de Uso</span>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E5DE] card-shadow space-y-6 text-sm text-[#2D312E] leading-relaxed">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F0E5DE]">
          <FileText className="w-8 h-8 text-[#E85D2A]" />
          <div>
            <h1 className="text-2xl font-black text-[#1C1C1C]">Termos e Condições de Uso</h1>
            <p className="text-xs text-[#6E7771]">Regras e diretrizes para usuários e comerciantes na plataforma Vitriniza</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1C1C1C]">1. Natureza do Serviço</h2>
          <p>
            A <strong>Vitriniza</strong> funciona como uma vitrine digital inteligente de divulgação comercial e comunitária. A plataforma facilita o contato direto entre consumidor e comerciante via WhatsApp, não intermediando pagamentos ou logística de entrega dos pedidos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1C1C1C]">2. Responsabilidade sobre Produtos e Serviços</h2>
          <p>
            Cada estabelecimento cadastrado é o único e exclusivo responsável pela veracidade dos preços, fotos, promoções, qualidade dos produtos e cumprimento das normas do Código de Defesa do Consumidor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1C1C1C]">3. Reivindicação de Empresas</h2>
          <p>
            Proprietários podem reivindicar seus estabelecimentos a qualquer momento através do formulário de comprovação na página da empresa.
          </p>
        </section>
      </div>
    </div>
  );
}
