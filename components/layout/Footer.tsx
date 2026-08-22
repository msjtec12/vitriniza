'use client';

import React from 'react';
import Link from 'next/link';
import { Store, MapPin, Sparkles, UserCheck } from 'lucide-react';
import { store } from '@/lib/data/store';

export const Footer: React.FC = () => {
  const categories = store.getCategories().slice(0, 8);
  const neighborhoods = store.getNeighborhoods();

  return (
    <footer className="bg-[#0E3B43] border-t border-[#1a5560] pt-14 pb-24 lg:pb-12 text-[#F8F6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 bg-[#F8F6F0] px-3.5 py-2 rounded-2xl shadow-xs hover:opacity-95 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Vitriniza"
                className="h-10 w-auto max-w-[160px] object-contain mix-blend-multiply"
              />
            </Link>

            <p className="text-xs sm:text-sm text-[#F8F6F0]/80 max-w-sm leading-relaxed">
              A vitrine digital inteligente que valoriza quem empreende, produz e movimenta a economia do seu bairro. Conectando moradores e comércios locais diretamente pelo WhatsApp.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#4FA6A6] font-bold">
              <Sparkles className="w-4 h-4 text-[#F49C6B]" />
              <span>Seu bairro tem muito. Descubra.</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-sm text-[#F8F6F0] mb-3 uppercase tracking-wider">
              Categorias Populares
            </h4>
            <ul className="space-y-2 text-xs text-[#F8F6F0]/75">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/buscar?categoria=${c.slug}`} className="hover:text-[#F49C6B] transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Neighborhoods / Regions */}
          <div>
            <h4 className="font-bold text-sm text-[#F8F6F0] mb-3 uppercase tracking-wider">
              Regiões & Bairros
            </h4>
            <ul className="space-y-2 text-xs text-[#F8F6F0]/75">
              {neighborhoods.map((n) => (
                <li key={n.id}>
                  <Link href={`/sp/sao-paulo/${n.slug}`} className="hover:text-[#F49C6B] flex items-center gap-1 transition-colors">
                    <MapPin className="w-3 h-3 text-[#E36845]" />
                    <span>{n.name} (SP)</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Merchants */}
          <div>
            <h4 className="font-bold text-sm text-[#F8F6F0] mb-3 uppercase tracking-wider">
              Para Empreendedores
            </h4>
            <ul className="space-y-2 text-xs text-[#F8F6F0]/75">
              <li>
                <Link href="/para-empresas" className="text-[#F49C6B] font-bold hover:underline">
                  Cadastrar meu Negócio →
                </Link>
              </li>
              <li>
                <Link href="/painel" className="hover:text-[#F49C6B] flex items-center gap-1.5 transition-colors">
                  <UserCheck className="w-3.5 h-3.5 text-[#4FA6A6]" />
                  <span>Área do Comerciante (Login)</span>
                </Link>
              </li>
              <li>
                <Link href="/descobrir" className="hover:text-[#F49C6B] transition-colors">
                  Histórias & Conteúdo Local
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 border-t border-[#1a5560] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F8F6F0]/60">
          <p>© {new Date().getFullYear()} Vitriniza. Todos os direitos reservados. Feito com amor pelo comércio local.</p>

          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:text-[#F8F6F0] transition-colors">Privacidade & LGPD</Link>
            <Link href="/termos" className="hover:text-[#F8F6F0] transition-colors">Termos de Uso</Link>
            <Link href="/cookies" className="hover:text-[#F8F6F0] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
