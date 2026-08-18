'use client';

import React from 'react';
import Link from 'next/link';
import { Cookie, ChevronRight } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-2 text-xs text-[#6E7771]">
        <Link href="/" className="hover:text-[#E85D2A]">Início</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-[#1C1C1C]">Política de Cookies</span>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E5DE] card-shadow space-y-6 text-sm text-[#2D312E] leading-relaxed">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F0E5DE]">
          <Cookie className="w-8 h-8 text-[#E85D2A]" />
          <div>
            <h1 className="text-2xl font-black text-[#1C1C1C]">Política de Cookies</h1>
            <p className="text-xs text-[#6E7771]">Como utilizamos cookies para melhorar sua experiência na Vitriniza</p>
          </div>
        </div>

        <p>
          Utilizamos cookies estritamente necessários e armazenamento local (localStorage) para lembrar sua região selecionada, comércios favoritados e preferências de busca, proporcionando uma navegação fluida sem necessidade de login obrigatório.
        </p>
      </div>
    </div>
  );
}
