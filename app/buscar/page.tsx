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
  Landmark,
  Store,
  Compass,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Category, Neighborhood, Place, PlaceCategoryGroup, SearchFilters } from '@/types';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { PlaceCard, PLACE_CATEGORY_META } from '@/components/ui/PlaceCard';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { cn } from '@/lib/utils';

type SearchTab = 'all' | 'businesses' | 'places';

function BuscarContent() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || '');
  const [selectedPlaceGroup, setSelectedPlaceGroup] = useState<PlaceCategoryGroup | ''>(
    (searchParams.get('grupo') as PlaceCategoryGroup) || ''
  );
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(searchParams.get('bairro') || '');
  const [minRating, setMinRating] = useState<number>(0);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [promotionsOnly, setPromotionsOnly] = useState(searchParams.get('promocoes') === 'true');
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('destaque') === 'true');
  const [sortBy, setSortBy] = useState<SearchFilters['sort_by']>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);

  useEffect(() => {
    setCategories(store.getCategories());
    setNeighborhoods(store.getNeighborhoods());
  }, []);

  useEffect(() => {
    const qParam = searchParams.get('q');
    const catParam = searchParams.get('categoria');
    const groupParam = searchParams.get('grupo') as PlaceCategoryGroup;
    const bParam = searchParams.get('bairro');
    const promoParam = searchParams.get('promocoes');
    const featParam = searchParams.get('destaque');
    const tabParam = searchParams.get('tipo') as SearchTab;

    if (qParam !== null) setQuery(qParam);
    if (catParam !== null) setSelectedCategory(catParam);
    if (groupParam) setSelectedPlaceGroup(groupParam);
    if (bParam !== null) setSelectedNeighborhood(bParam);
    if (promoParam !== null) setPromotionsOnly(promoParam === 'true');
    if (featParam !== null) setFeaturedOnly(featParam === 'true');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    // 1. Query businesses
    const bizResults = store.getBusinesses({
      query: query || undefined,
      category_id: selectedCategory || undefined,
      neighborhood_id: selectedNeighborhood || undefined,
      min_rating: minRating > 0 ? minRating : undefined,
      open_now: openNowOnly || undefined,
      promotions_only: promotionsOnly || undefined,
      featured_only: featuredOnly || undefined,
      sort_by: sortBy,
    });
    setBusinesses(bizResults);

    // 2. Query places
    const placeResults = store.getPlaces({
      query: query || undefined,
      category_group: selectedPlaceGroup || undefined,
      neighborhood_id: selectedNeighborhood || undefined,
    });
    setPlaces(placeResults);
  }, [
    query,
    selectedCategory,
    selectedPlaceGroup,
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
    setSelectedPlaceGroup('');
    setSelectedNeighborhood('');
    setMinRating(0);
    setOpenNowOnly(false);
    setPromotionsOnly(false);
    setFeaturedOnly(false);
    setSortBy('recommended');
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedPlaceGroup ? 1 : 0) +
    (selectedNeighborhood ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (openNowOnly ? 1 : 0) +
    (promotionsOnly ? 1 : 0) +
    (featuredOnly ? 1 : 0);

  const totalResults = businesses.length + places.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 bg-[#F8F6F0] min-h-screen">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4FA6A6]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar comércios, prestadores, UBS, parques, escolas..."
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
                  ? 'bg-[#0E3B43] text-white shadow-xs'
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
                  ? 'bg-[#0E3B43] text-white shadow-xs'
                  : 'text-[#537379] hover:text-[#0E3B43]'
              )}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Discovery Tabs: [Todos] [Negócios] [Utilidade Pública] */}
      <div className="flex items-center gap-2 border-b border-[#E8E4DA] pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shrink-0',
            activeTab === 'all'
              ? 'bg-[#0E3B43] text-white shadow-md'
              : 'bg-white text-[#0E3B43] border border-[#E8E4DA] hover:bg-stone-50'
          )}
        >
          <Compass className="w-4 h-4" />
          <span>Todos os Resultados</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-current">
            {totalResults}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('businesses')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shrink-0',
            activeTab === 'businesses'
              ? 'bg-[#E36845] text-white shadow-md'
              : 'bg-white text-[#0E3B43] border border-[#E8E4DA] hover:bg-stone-50'
          )}
        >
          <Store className="w-4 h-4" />
          <span>Comércios & Serviços</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-current">
            {businesses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('places')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shrink-0',
            activeTab === 'places'
              ? 'bg-[#0D9488] text-white shadow-md'
              : 'bg-white text-[#0E3B43] border border-[#E8E4DA] hover:bg-stone-50'
          )}
        >
          <Landmark className="w-4 h-4" />
          <span>Utilidade Pública & Locais</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-current">
            {places.length}
          </span>
        </button>
      </div>

      {/* Secondary Category / Subgroup Carousel */}
      {activeTab === 'places' ? (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedPlaceGroup('')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border',
              !selectedPlaceGroup
                ? 'bg-[#0D9488] text-white border-[#0D9488]'
                : 'bg-white text-[#0E3B43] border-[#4FA6A6]/25 hover:bg-stone-50'
            )}
          >
            Todos os Locais
          </button>
          {(Object.keys(PLACE_CATEGORY_META) as PlaceCategoryGroup[]).map((groupKey) => {
            const meta = PLACE_CATEGORY_META[groupKey];
            const Icon = meta.icon;
            const isSelected = selectedPlaceGroup === groupKey;
            return (
              <button
                key={groupKey}
                type="button"
                onClick={() => setSelectedPlaceGroup(isSelected ? '' : groupKey)}
                className={cn(
                  'px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 border',
                  isSelected
                    ? `${meta.bg} border-current shadow-xs`
                    : 'bg-white text-[#0E3B43] border-[#E8E4DA] hover:bg-stone-50'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border',
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
      )}

      {/* Main Grid & Filters Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow h-fit sticky top-24">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#E36845]" />
              <span>Filtros Regionais</span>
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
              <option value="">Todos os bairros</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.slug}>
                  {n.name} ({n.city?.name || 'SP'})
                </option>
              ))}
            </select>
          </div>

          {/* Business Conditions (Only relevant if showing businesses) */}
          {activeTab !== 'places' && (
            <div className="space-y-2.5 pt-2 border-t border-[#E8E4DA]">
              <span className="block text-xs font-bold text-[#537379] uppercase tracking-wider mb-1">
                Condições de Atendimento
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
                  <Sparkles className="w-3.5 h-3.5 text-[#E36845]" /> Destaques da região
                </span>
              </label>
            </div>
          )}

          {/* Rating Filter (Only for businesses) */}
          {activeTab !== 'places' && (
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
          )}
        </aside>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-5">
          {/* Result Count Status */}
          <div className="flex items-center justify-between text-xs text-[#537379] px-1">
            <span>
              Mostrando{' '}
              <strong className="text-[#0E3B43]">
                {activeTab === 'all'
                  ? `${businesses.length} negócios e ${places.length} locais`
                  : activeTab === 'businesses'
                  ? `${businesses.length} comércios e serviços`
                  : `${places.length} locais públicos`}
              </strong>
            </span>
            {activeFiltersCount > 0 && (
              <span className="text-[#E36845] font-bold">
                {activeFiltersCount} filtro(s) aplicado(s)
              </span>
            )}
          </div>

          {viewMode === 'map' ? (
            <div className="h-[620px] w-full">
              <LeafletMap
                businesses={activeTab === 'places' ? [] : businesses}
                places={activeTab === 'businesses' ? [] : places}
                height="100%"
              />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tab: All - Show Places first if matching, then businesses */}
              {activeTab === 'all' && (
                <>
                  {/* Public Places Section */}
                  {places.length > 0 && (
                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-[#0D9488]" />
                          <h3 className="text-sm font-black text-[#0E3B43] uppercase tracking-wider">
                            Locais de Utilidade Pública & Referência ({places.length})
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('places')}
                          className="text-xs font-bold text-[#0D9488] hover:underline"
                        >
                          Ver só locais →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {places.map((place) => (
                          <PlaceCard key={place.id} place={place} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Businesses Section */}
                  {businesses.length > 0 && (
                    <section className="space-y-3 pt-4 border-t border-[#E8E4DA]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-[#E36845]" />
                          <h3 className="text-sm font-black text-[#0E3B43] uppercase tracking-wider">
                            Comércios & Prestadores de Serviço ({businesses.length})
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('businesses')}
                          className="text-xs font-bold text-[#E36845] hover:underline"
                        >
                          Ver só comércios →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {businesses.map((biz) => (
                          <BusinessCard key={biz.id} business={biz} />
                        ))}
                      </div>
                    </section>
                  )}

                  {totalResults === 0 && (
                    <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#E8E4DA] p-8">
                      <Search className="w-12 h-12 text-[#537379] mx-auto mb-3 opacity-40" />
                      <h3 className="text-base font-black text-[#0E3B43] mb-1">
                        Nenhum resultado encontrado
                      </h3>
                      <p className="text-xs text-[#537379] max-w-sm mx-auto mb-5 leading-relaxed">
                        Não encontramos negócios ou locais públicos para os critérios informados. Tente buscar por outros termos ou limpar os filtros.
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
                </>
              )}

              {/* Tab: Only Businesses */}
              {activeTab === 'businesses' && (
                <>
                  {businesses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {businesses.map((biz) => (
                        <BusinessCard key={biz.id} business={biz} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#E8E4DA] p-8">
                      <Store className="w-12 h-12 text-[#537379] mx-auto mb-3 opacity-40" />
                      <h3 className="text-base font-black text-[#0E3B43] mb-1">
                        Nenhum comércio ou serviço encontrado
                      </h3>
                      <p className="text-xs text-[#537379] max-w-sm mx-auto mb-5 leading-relaxed">
                        Não encontramos estabelecimentos para os filtros selecionados.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-6 py-2.5 rounded-full bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Tab: Only Places */}
              {activeTab === 'places' && (
                <>
                  {places.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {places.map((place) => (
                        <PlaceCard key={place.id} place={place} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#E8E4DA] p-8">
                      <Landmark className="w-12 h-12 text-[#537379] mx-auto mb-3 opacity-40" />
                      <h3 className="text-base font-black text-[#0E3B43] mb-1">
                        Nenhum ponto público encontrado
                      </h3>
                      <p className="text-xs text-[#537379] max-w-sm mx-auto mb-5 leading-relaxed">
                        Não encontramos locais de utilidade pública para esta categoria ou região.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-6 py-2.5 rounded-full bg-[#0D9488] hover:bg-[#154E58] text-white text-xs font-bold shadow-sm transition-all"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
              <h3 className="font-black text-lg text-[#0E3B43]">Filtros de Busca</h3>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1 text-[#537379] hover:text-[#0E3B43]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#537379] uppercase tracking-wider mb-2">
                Bairro / Região
              </label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-sm font-bold text-[#0E3B43] outline-none"
              >
                <option value="">Todos os bairros</option>
                {neighborhoods.map((n) => (
                  <option key={n.id} value={n.slug}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={openNowOnly}
                  onChange={(e) => setOpenNowOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E36845]"
                />
                <span className="text-sm font-bold text-[#0E3B43]">Aberto agora</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={promotionsOnly}
                  onChange={(e) => setPromotionsOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E36845]"
                />
                <span className="text-sm font-bold text-[#0E3B43]">Somente promoções ativas</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E36845]"
                />
                <span className="text-sm font-bold text-[#0E3B43]">Destaques</span>
              </label>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-xl bg-[#F8F6F0] text-xs font-bold text-[#537379]"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#0E3B43] text-white text-xs font-bold"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
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
