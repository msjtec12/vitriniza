'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Crosshair, Sparkles } from 'lucide-react';
import { store } from '@/lib/data/store';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  initialQuery?: string;
  initialNeighborhood?: string;
  className?: string;
  variant?: 'hero' | 'compact';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  initialNeighborhood = '',
  className,
  variant = 'hero',
}) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood || 'guaianases');
  const [isLocating, setIsLocating] = useState(false);

  const neighborhoods = store.getNeighborhoods();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (neighborhood) params.set('bairro', neighborhood);
    router.push(`/buscar?${params.toString()}`);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        params.set('lat', lat.toString());
        params.set('lng', lng.toString());
        params.set('raio', '5');
        router.push(`/buscar?${params.toString()}`);
      },
      () => {
        setIsLocating(false);
        alert('Não foi possível obter sua localização. Por favor, selecione seu bairro na lista.');
      }
    );
  };

  const quickTags = [
    { label: '🏠 Imóveis & Aluguel', q: 'imovel' },
    { label: '🩺 Planos de Saúde', q: 'saude' },
    { label: '⚡ Eletricista 24h', q: 'eletricista' },
    { label: '🧹 Diaristas', q: 'diarista' },
    { label: '🍕 Pizzas', q: 'pizza' },
    { label: '💇 Barbearia', q: 'barbearia' },
    { label: '🎂 Bolos & Doces', q: 'bolo' },
    { label: '🐶 Pet Shop', q: 'pet' },
    { label: '🚗 Oficina', q: 'mecanica' },
  ];

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSearch} className={cn('relative flex items-center gap-2', className)}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#537379]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você procura no bairro?"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#4FA6A6]/40 focus:border-[#E36845] text-sm text-[#0E3B43] placeholder:text-[#537379] outline-none transition-all shadow-2xs"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-full bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold transition-all shrink-0 shadow-xs"
        >
          Buscar
        </button>
      </form>
    );
  }

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-full border-2 border-[#4FA6A6]/30 hover:border-[#4FA6A6]/60 shadow-xl shadow-[#0E3B43]/5 gap-2 sm:gap-0 transition-all"
      >
        {/* Field 1: Query */}
        <div className="flex-1 flex items-center px-4 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-[#E8E4DA]">
          <Search className="w-5 h-5 text-[#4FA6A6] shrink-0 mr-3" />
          <div className="w-full text-left">
            <label className="block text-[10px] font-bold text-[#537379] uppercase tracking-wider">
              O que você procura?
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: pizzaria, salão, eletricista..."
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-[#0E3B43] placeholder:text-[#537379]/60 outline-none truncate"
            />
          </div>
        </div>

        {/* Field 2: Location / Neighborhood */}
        <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
          <MapPin className="w-5 h-5 text-[#E36845] shrink-0 mr-3" />
          <div className="w-full text-left">
            <label className="block text-[10px] font-bold text-[#537379] uppercase tracking-wider">
              Onde?
            </label>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-[#0E3B43] outline-none cursor-pointer"
            >
              <option value="">Todas as regiões (SP)</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.slug}>
                  {n.name} - São Paulo
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCurrentLocation}
            title="Usar minha localização atual"
            className={cn(
              'p-2 rounded-full text-[#4FA6A6] hover:bg-[#F8F6F0] transition-all shrink-0 ml-1',
              isLocating && 'animate-spin text-[#E36845]'
            )}
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* CTA Button in Laranja Coral (#E36845) with Hover Laranja Pêssego (#F49C6B) */}
        <button
          type="submit"
          className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-full bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm sm:text-base font-bold transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Buscar</span>
        </button>
      </form>

      {/* Quick Search Suggestions */}
      <div className="mt-3.5 flex items-center gap-1.5 flex-wrap justify-center text-xs">
        <span className="text-[#537379] flex items-center gap-1 text-[11px] font-semibold mr-1">
          <Sparkles className="w-3 h-3 text-[#E36845]" /> Sugestões:
        </span>
        {quickTags.map((tag) => (
          <button
            key={tag.q}
            type="button"
            onClick={() => {
              setQuery(tag.q);
              const params = new URLSearchParams();
              params.set('q', tag.q);
              if (neighborhood) params.set('bairro', neighborhood);
              router.push(`/buscar?${params.toString()}`);
            }}
            className="px-3 py-1 rounded-full bg-white hover:bg-[#F8F6F0] text-[#0E3B43] border border-[#E8E4DA] hover:border-[#E36845] text-xs font-semibold transition-all shadow-2xs"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};
