'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Sparkles, Flame, Store, ChevronRight, ChevronLeft, Award, ShoppingBag, ArrowRight, Landmark } from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Category, Promotion, Place } from '@/types';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { PlaceCard } from '@/components/ui/PlaceCard';
import { BusinessFeaturedCard } from '@/components/ui/BusinessFeaturedCard';
import { PromotionCard } from '@/components/ui/PromotionCard';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { cn } from '@/lib/utils';

export default function NeighborhoodHubPage() {
  const params = useParams();
  const neighborhoodSlug = (params.neighborhood as string) || '';
  const citySlug = (params.city as string) || '';
  const stateUf = ((params.state as string) || 'sp').toUpperCase();

  const formatSlugName = (slug: string) => {
    if (!slug) return '';
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoodName, setNeighborhoodName] = useState(() => formatSlugName(neighborhoodSlug) || 'Bairro');
  const cityName = formatSlugName(citySlug) || 'São Paulo';

  useEffect(() => {
    const neighs = store.getNeighborhoods();
    const currentNeigh = neighs.find((n) => n.slug === neighborhoodSlug);
    if (currentNeigh) setNeighborhoodName(currentNeigh.name);

    setCategories(store.getCategories());
    const list = store.getBusinesses({ neighborhood_id: currentNeigh?.id || neighborhoodSlug });
    setBusinesses(list);
    setFeaturedBusinesses(list.filter((b) => b.is_featured || b.is_founder).slice(0, 4));
    setPromotions(store.getPromotions().filter((p) => p.neighborhood_name?.toLowerCase() === neighborhoodName.toLowerCase()));

    const pList = store.getPlaces({ neighborhood_id: currentNeigh?.id || neighborhoodSlug });
    setPlaces(pList);
  }, [neighborhoodSlug, neighborhoodName]);

  const totalProducts = businesses.reduce((acc, b) => acc + (b.products?.length || 0), 0);

  // Places Horizontal Scroll & Drag
  const placeScrollRef = useRef<HTMLDivElement>(null);
  const [isPlaceDragging, setIsPlaceDragging] = useState(false);
  const [placeStartX, setPlaceStartX] = useState(0);
  const [placeScrollLeft, setPlaceScrollLeft] = useState(0);

  const scrollPlaces = (direction: 'left' | 'right') => {
    if (!placeScrollRef.current) return;
    const scrollAmount = direction === 'left' ? -350 : 350;
    placeScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handlePlaceMouseDown = (e: React.MouseEvent) => {
    if (!placeScrollRef.current) return;
    setIsPlaceDragging(true);
    setPlaceStartX(e.pageX - placeScrollRef.current.offsetLeft);
    setPlaceScrollLeft(placeScrollRef.current.scrollLeft);
  };

  const handlePlaceMouseMove = (e: React.MouseEvent) => {
    if (!isPlaceDragging || !placeScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - placeScrollRef.current.offsetLeft;
    const walk = (x - placeStartX) * 1.3;
    placeScrollRef.current.scrollLeft = placeScrollLeft - walk;
  };

  const handlePlaceMouseUpOrLeave = () => {
    setIsPlaceDragging(false);
  };

  return (
    <div className="pb-20 space-y-12 bg-[#F8F6F0]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E8E4DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#537379] flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-[#E36845] transition-colors">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/buscar" className="hover:text-[#E36845] transition-colors">{cityName} ({stateUf})</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-bold text-[#0E3B43]">{neighborhoodName}</span>
        </div>
      </div>

      {/* Hero Header Portal */}
      <section className="bg-gradient-to-b from-white via-white to-[#F8F6F0] py-10 sm:py-14 border-b border-[#E8E4DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E3B43] text-white border border-[#4FA6A6]/40 text-xs font-black shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Portal Oficial do Bairro</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#0E3B43] tracking-tight">
            Descubra <span className="text-[#E36845]">{neighborhoodName}</span>
          </h1>

          <p className="text-sm sm:text-base text-[#537379] max-w-2xl mx-auto font-medium leading-relaxed">
            Encontre lojas, profissionais, serviços, ofertas e negócios do bairro e entre em contato direto pelo WhatsApp.
          </p>

          {/* Indicators strictly when real data exists */}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2 text-xs font-bold text-[#0E3B43]">
            {businesses.length > 0 && (
              <span className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DA] shadow-2xs flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#E36845]" /> {businesses.length} negócios
              </span>
            )}
            {totalProducts > 0 && (
              <span className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DA] shadow-2xs flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#4FA6A6]" /> {totalProducts} produtos e serviços
              </span>
            )}
            {promotions.length > 0 && (
              <span className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DA] shadow-2xs flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#E36845]" /> {promotions.length} ofertas ativas
              </span>
            )}
            {places.length > 0 && (
              <span className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DA] shadow-2xs flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#0D9488]" /> {places.length} locais públicos
              </span>
            )}
          </div>

          {/* SearchBar Embed */}
          <div className="pt-4 max-w-2xl mx-auto">
            <SearchBar variant="compact" initialNeighborhood={neighborhoodSlug} />
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      {featuredBusinesses.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-[#0E3B43] tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E36845]" />
                <span>Destaques de {neighborhoodName}</span>
              </h2>
              <p className="text-xs text-[#537379]">Estabelecimentos e profissionais patrocinados no bairro</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {featuredBusinesses.map((biz) => (
              <BusinessFeaturedCard key={biz.id} business={biz} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-black text-[#0E3B43] mb-4">
          Categorias em {neighborhoodName}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((c) => {
            const count = businesses.filter((b) => b.category_id === c.id || b.category?.slug === c.slug).length;
            return (
              <CategoryCard
                key={c.id}
                category={c}
                count={count}
                variant="grid"
              />
            );
          })}
        </div>
      </section>

      {/* Promotions Section */}
      {promotions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-[#0E3B43] tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#E36845]" />
                <span>Ofertas em {neighborhoodName}</span>
              </h2>
              <p className="text-xs text-[#537379]">Descontos e promoções do seu bairro</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {promotions.map((promo) => (
              <PromotionCard key={promo.id} promotion={promo} />
            ))}
          </div>
        </section>
      )}

      {/* Public Places & Reference Points Section (CARROSSEL EM UMA LINHA COM ARRASTE) */}
      {places.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-black text-[#0E3B43] tracking-tight flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[#0D9488]" />
                <span>Utilidade Pública & Referências em {neighborhoodName}</span>
              </h2>
              <p className="text-xs text-[#537379]">Postos de saúde, escolas, parques, estações e órgãos públicos</p>
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollPlaces('left')}
                aria-label="Rolar locais para esquerda"
                className="p-2 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#0D9488] transition-all shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollPlaces('right')}
                aria-label="Rolar locais para direita"
                className="p-2 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#0D9488] transition-all shadow-2xs cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={placeScrollRef}
            onMouseDown={handlePlaceMouseDown}
            onMouseMove={handlePlaceMouseMove}
            onMouseUp={handlePlaceMouseUpOrLeave}
            onMouseLeave={handlePlaceMouseUpOrLeave}
            className={cn(
              'flex gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-4 pt-1 cursor-grab transition-all',
              isPlaceDragging && 'cursor-grabbing select-none'
            )}
          >
            {places.map((place) => (
              <div key={place.id} className="shrink-0 w-[300px] sm:w-[350px] md:w-[380px] snap-start">
                <PlaceCard place={place} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Businesses Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-[#0E3B43] tracking-tight">
              Todos os Comércios de {neighborhoodName} ({businesses.length})
            </h2>
            <p className="text-xs text-[#537379]">Negócios verificados e em funcionamento</p>
          </div>
        </div>

        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-3">
            <Store className="w-12 h-12 text-[#537379] mx-auto opacity-40" />
            <h3 className="font-black text-base text-[#0E3B43]">Novos negócios estão chegando a {neighborhoodName}.</h3>
            <p className="text-xs text-[#537379] max-w-md mx-auto">
              Conhece um comércio ou profissional que deveria estar aqui? Indique para a Vitriniza ou cadastre sua loja!
            </p>
            <div className="pt-2">
              <Link
                href="/para-empresas"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-md transition-all"
              >
                <span>Cadastrar meu negócio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
