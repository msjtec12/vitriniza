'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin, Search } from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Category } from '@/types';
import { BusinessCard } from '@/components/ui/BusinessCard';

export default function CategorySEOPage() {
  const params = useParams();
  const neighborhoodSlug = (params.neighborhood as string) || 'guaianases';
  const categorySlug = params.category as string;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [neighborhoodName, setNeighborhoodName] = useState('Guaianases');

  useEffect(() => {
    const neighs = store.getNeighborhoods();
    const currentNeigh = neighs.find((n) => n.slug === neighborhoodSlug);
    if (currentNeigh) setNeighborhoodName(currentNeigh.name);

    const cats = store.getCategories();
    const currentCat = cats.find((c) => c.slug === categorySlug);
    if (currentCat) setCategory(currentCat);

    const list = store.getBusinesses({
      neighborhood_id: neighborhoodSlug,
      category_id: categorySlug,
    });
    setBusinesses(list);
  }, [neighborhoodSlug, categorySlug]);

  return (
    <div className="pb-16 space-y-8 bg-[#F8F6F0]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E8E4DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#537379] flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-[#E36845] transition-colors">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/sp/sao-paulo/${neighborhoodSlug}`} className="hover:text-[#E36845] transition-colors">{neighborhoodName}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-bold text-[#0E3B43]">{category?.name || categorySlug}</span>
        </div>
      </div>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-gradient-to-b from-white to-[#F8F6F0] border border-[#4FA6A6]/20 card-shadow">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-xs font-bold text-[#0E3B43] border border-[#4FA6A6]/30 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#E36845]" />
            <span>{neighborhoodName} (São Paulo)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#0E3B43] tracking-tight mb-2">
            {category?.name || 'Comércio'} em <span className="text-[#E36845]">{neighborhoodName}</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#537379] max-w-2xl">
            {category?.description || 'Encontre os melhores estabelecimentos e prestadores de serviço recomendados nesta categoria no bairro.'}
          </p>
        </div>
      </section>

      {/* Businesses Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <span className="text-xs text-[#537379]">
            Mostrando <strong className="text-[#0E3B43]">{businesses.length}</strong> estabelecimentos encontrados
          </span>
        </div>

        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {businesses.map((biz) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#E8E4DA] p-8">
            <Search className="w-10 h-10 text-[#537379] mx-auto mb-2 opacity-40" />
            <h3 className="text-sm font-black text-[#0E3B43]">Nenhum comércio cadastrado nesta categoria ainda.</h3>
            <p className="text-xs text-[#537379] mt-1">Conhece alguém neste segmento em {neighborhoodName}? Indique para a Vitriniza!</p>
          </div>
        )}
      </section>
    </div>
  );
}
