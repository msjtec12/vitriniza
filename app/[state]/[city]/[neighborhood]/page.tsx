'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Sparkles, Flame, Store, ArrowRight, ChevronRight } from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Category, Promotion } from '@/types';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { PromotionCard } from '@/components/ui/PromotionCard';
import { CategoryCard } from '@/components/ui/CategoryCard';

export default function NeighborhoodHubPage() {
  const params = useParams();
  const neighborhoodSlug = (params.neighborhood as string) || 'guaianases';

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoodName, setNeighborhoodName] = useState('Guaianases');

  useEffect(() => {
    const neighs = store.getNeighborhoods();
    const currentNeigh = neighs.find((n) => n.slug === neighborhoodSlug);
    if (currentNeigh) setNeighborhoodName(currentNeigh.name);

    setCategories(store.getCategories());
    const list = store.getBusinesses({ neighborhood_id: neighborhoodSlug });
    setBusinesses(list);
    setPromotions(store.getPromotions().filter((p) => p.neighborhood_name?.toLowerCase() === neighborhoodName.toLowerCase()).slice(0, 3));
  }, [neighborhoodSlug, neighborhoodName]);

  return (
    <div className="pb-16 space-y-10 bg-[#F8F6F0]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E8E4DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#537379] flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-[#E36845] transition-colors">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/buscar" className="hover:text-[#E36845] transition-colors">São Paulo</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-bold text-[#0E3B43]">{neighborhoodName}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#F8F6F0] py-10 border-b border-[#E8E4DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4FA6A6]/15 text-xs font-bold text-[#0E3B43] border border-[#4FA6A6]/30 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Guia Comercial & Vitrine Digital</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0E3B43] tracking-tight mb-3">
            Comércio e Serviços em <span className="text-[#E36845]">{neighborhoodName}</span>
          </h1>

          <p className="text-sm sm:text-base text-[#537379] max-w-2xl leading-relaxed">
            Descubra os melhores restaurantes, prestadores de serviço, lojas e profissionais autônomos de {neighborhoodName} e entre em contato direto pelo WhatsApp.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-black text-[#0E3B43] mb-4">
          Categorias em {neighborhoodName}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/sp/sao-paulo/${neighborhoodSlug}/categoria/${c.slug}`}
              className="p-4 rounded-2xl bg-white border border-[#4FA6A6]/20 hover:border-[#E36845] card-shadow text-center flex flex-col items-center gap-2 group transition-all"
            >
              <span className="text-2xl">🏬</span>
              <span className="text-xs font-bold text-[#0E3B43] group-hover:text-[#E36845] transition-colors">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Businesses Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-[#0E3B43] tracking-tight">
              Todos os Estabelecimentos ({businesses.length})
            </h2>
            <p className="text-xs text-[#537379]">Comércios cadastrados e verificados no bairro</p>
          </div>
          <Link
            href={`/buscar?bairro=${neighborhoodSlug}`}
            className="text-xs font-bold text-[#E36845] hover:text-[#F49C6B] flex items-center gap-1 transition-colors"
          >
            <span>Filtrar</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
