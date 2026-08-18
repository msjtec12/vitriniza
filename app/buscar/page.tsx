'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Star,
  Clock,
  Flame,
  Sparkles,
  Grid,
  Map as MapIcon,
  X,
  RotateCcw,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Category, Neighborhood, SearchFilters } from '@/types';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { cn } from '@/lib/utils';

function BuscarContent() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(searchParams.get('bairro') || '');
  const [minRating, setMinRating] = useState<number>(0);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [promotionsOnly, setPromotionsOnly] = useState(searchParams.get('promocoes') === 'true');
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('destaque') === 'true');
  const [sortBy, setSortBy] = useState<SearchFilters['sort_by']>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);

  useEffect(() => {
    setCategories(store.getCategories());
    setNeighborhoods(store.getNeighborhoods());
  }, []);

  useEffect(() => {
    const qParam = searchParams.get('q');
    const catParam = searchParams.get('categoria');
    const bParam = searchParams.get('bairro');
    const promoParam = searchParams.get('promocoes');
    const featParam = searchParams.get('destaque');

    if (qParam !== null) setQuery(qParam);
    if (catParam !== null) setSelectedCategory(catParam);
    if (bParam !== null) setSelectedNeighborhood(bParam);
    if (promoParam !== null) setPromotionsOnly(promoParam === 'true');
    if (featParam !== null) setFeaturedOnly(featParam === 'true');
  }, [searchParams]);

  useEffect(() => {
    const results = store.getBusinesses({
      query: query || undefined,
      category_id: selectedCategory || undefined,
      neighborhood_id: selectedNeighborhood || undefined,
      min_rating: minRating > 0 ? minRating : undefined,
      open_now: openNowOnly || undefined,
      promotions_only: promotionsOnly || undefined,
      featured_only: featuredOnly || undefined,
      sort_by: sortBy,
    });
    setBusinesses(results);
  }, [
    query,
    selectedCategory,
    selectedNeighborhood,
    minRating,
    openNowOnly,
    promotionsOnly,
    featuredOnly,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedNeighborhood('');
    setMinRating(0);
    setOpenNowOnly(false);
    setPromotionsOnly(false);
    setFeaturedOnly(false);
    setSortBy('recommended');
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedNeighborhood ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (openNowOnly ? 1 : 0) +
    (promotionsOnly ? 1 : 0) +
    (featuredOnly ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 bg-[#F8F6F0]">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4FA6A6]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por nome, produto, serviço ou categoria..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-[#4FA6A6]/30 focus:border-[#E36845] text-sm sm:text-base text-[#0E3B43] outline-none shadow-xs transition-all placeholder:text-[#537379]/60"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#537379] hover:text-[#0E3B43]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white border border-[#E8E4DA] text-sm font-bold text-[#0E3B43] shadow-xs"
          >
            <Filter className="w-4 h-4 text-[#E36845]" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#E36845] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-3.5 rounded-2xl bg-white border border-[#E8E4DA] text-xs sm:text-sm font-bold text-[#0E3B43] outline-none cursor-pointer shadow-xs"
          >
            <option value="recommended">Recomendados</option>
            <option value="rating">Melhor avaliados</option>
            <option value="visits">Mais populares</option>
            <option value="recent">Recentes</option>
          </select>

          {/* Grid / Map toggle */}
          <div className="flex items-center p-1 rounded-2xl bg-white border border-[#E8E4DA] shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Visualização em lista e grade"
              className={cn(
                'p-2.5 rounded-xl transition-all',
                viewMode === 'grid'
                  ? 'bg-[#E36845] text-white shadow-xs'
                  : 'text-[#537379] hover:text-[#0E3B43]'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              aria-label="Visualização no mapa interativo"
              className={cn(
                'p-2.5 rounded-xl transition-all',
                viewMode === 'map'
                  ? 'bg-[#E36845] text-white shadow-xs'
                  : 'text-[#537379] hover:text-[#0E3B43]'
              )}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={cn(
            'px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border',
            !selectedCategory
              ? 'bg-[#0E3B43] text-white border-[#0E3B43]'
              : 'bg-white text-[#0E3B43] border-[#4FA6A6]/25 hover:bg-stone-50'
          )}
        >
          Todas as Categorias
        </button>
        {categories.map((c) => (
          <CategoryCard
            key={c.id}
            category={c}
            variant="pill"
            isSelected={selectedCategory === c.slug || selectedCategory === c.id}
            onClick={() => {
              if (selectedCategory === c.slug) setSelectedCategory('');
              else setSelectedCategory(c.slug);
            }}
          />
        ))}
      </div>

      {/* Main Grid & Filters Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow h-fit sticky top-24">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#E36845]" />
              <span>Filtros Avançados</span>
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#E36845] hover:underline flex items-center gap-1 font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>

          {/* Neighborhood Selector */}
          <div>
            <label className="block text-xs font-bold text-[#537379] uppercase tracking-wider mb-2">
              Bairro / Região
            </label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
            >
              <option value="">Todos os bairros (SP)</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.slug}>
                  {n.name} (São Paulo)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Filter Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-[#E8E4DA]">
            <span className="block text-xs font-bold text-[#537379] uppercase tracking-wider mb-1">
              Condições
            </span>

            <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#F8F6F0] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={openNowOnly}
                onChange={(e) => setOpenNowOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#E36845] focus:ring-[#E36845]"
              />
              <span className="text-xs font-bold text-[#0E3B43] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4FA6A6]" /> Aberto agora
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#F8F6F0] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={promotionsOnly}
                onChange={(e) => setPromotionsOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#E36845] focus:ring-[#E36845]"
              />
              <span className="text-xs font-bold text-[#0E3B43] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#E36845]" /> Somente ofertas ativas
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#F8F6F0] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#E36845] focus:ring-[#E36845]"
              />
              <span className="text-xs font-bold text-[#0E3B43] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E36845]" /> Estabelecimentos em destaque
              </span>
            </label>
          </div>

          {/* Rating Filter */}
          <div className="pt-2 border-t border-[#E8E4DA]">
            <span className="block text-xs font-bold text-[#537379] uppercase tracking-wider mb-2">
              Avaliação Mínima
            </span>
            <div className="space-y-1.5">
              {[0, 4.5, 4.0, 3.5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setMinRating(rating)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors',
                    minRating === rating
                      ? 'bg-[#E36845]/10 text-[#E36845] font-bold'
                      : 'text-[#0E3B43] hover:bg-[#F8F6F0]'
                  )}
                >
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {rating === 0 ? 'Qualquer nota' : `${rating.toFixed(1)} estrelas ou mais`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Result Count Status */}
          <div className="flex items-center justify-between text-xs text-[#537379] px-1">
            <span>
              Mostrando <strong className="text-[#0E3B43]">{businesses.length}</strong> estabelecimentos encontrados
            </span>
            {activeFiltersCount > 0 && (
              <span className="text-[#E36845] font-bold">
                {activeFiltersCount} filtro(s) aplicado(s)
              </span>
            )}
          </div>

          {viewMode === 'map' ? (
            <div className="h-[600px] w-full">
              <LeafletMap businesses={businesses} height="100%" />
            </div>
          ) : businesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {businesses.map((biz) => (
                <BusinessCard key={biz.id} business={biz} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#E8E4DA] p-8">
              <Search className="w-12 h-12 text-[#537379] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-black text-[#0E3B43] mb-1">
                Nenhum resultado encontrado
              </h3>
              <p className="text-xs text-[#537379] max-w-sm mx-auto mb-5 leading-relaxed">
                Não encontramos nenhum estabelecimento para os filtros selecionados. Tente buscar por outros termos ou limpar os filtros.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-full bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Carregando busca...</div>}>
      <BuscarContent />
    </Suspense>
  );
}
