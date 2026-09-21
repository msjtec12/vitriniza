'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  ExternalLink,
  Navigation,
  Building2,
  HeartPulse,
  GraduationCap,
  Trees,
  Train,
  Landmark,
  Church,
  Palette,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { Place, PlaceCategoryGroup } from '@/types';
import { cn } from '@/lib/utils';

export const PLACE_CATEGORY_META: Record<
  PlaceCategoryGroup,
  { label: string; icon: React.ElementType; color: string; bg: string; text: string; pinColor: string }
> = {
  saude: {
    label: 'Saúde & UBS',
    icon: HeartPulse,
    color: '#E11D48',
    bg: 'bg-rose-50 border-rose-200 text-rose-700',
    text: 'text-rose-700',
    pinColor: '#E11D48',
  },
  educacao: {
    label: 'Educação',
    icon: GraduationCap,
    color: '#2563EB',
    bg: 'bg-blue-50 border-blue-200 text-blue-700',
    text: 'text-blue-700',
    pinColor: '#2563EB',
  },
  lazer: {
    label: 'Lazer & Parques',
    icon: Trees,
    color: '#059669',
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    text: 'text-emerald-700',
    pinColor: '#059669',
  },
  transporte: {
    label: 'Transporte & Estações',
    icon: Train,
    color: '#7C3AED',
    bg: 'bg-purple-50 border-purple-200 text-purple-700',
    text: 'text-purple-700',
    pinColor: '#7C3AED',
  },
  servicos_publicos: {
    label: 'Serviços Públicos',
    icon: Landmark,
    color: '#0D9488',
    bg: 'bg-teal-50 border-teal-200 text-teal-700',
    text: 'text-teal-700',
    pinColor: '#0D9488',
  },
  religiao: {
    label: 'Igrejas & Fé',
    icon: Church,
    color: '#D97706',
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    text: 'text-amber-700',
    pinColor: '#D97706',
  },
  cultura: {
    label: 'Cultura & Artes',
    icon: Palette,
    color: '#DB2777',
    bg: 'bg-pink-50 border-pink-200 text-pink-700',
    text: 'text-pink-700',
    pinColor: '#DB2777',
  },
  outros: {
    label: 'Utilidade Pública',
    icon: Building2,
    color: '#475569',
    bg: 'bg-slate-50 border-slate-200 text-slate-700',
    text: 'text-slate-700',
    pinColor: '#475569',
  },
};

interface PlaceCardProps {
  place: Place;
  userDistance?: number;
  showNearbyPrompt?: boolean;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  userDistance,
  showNearbyPrompt = true,
}) => {
  const meta = PLACE_CATEGORY_META[place.category_group] || PLACE_CATEGORY_META.outros;
  const CategoryIcon = meta.icon;

  const placeUrl = `/lugares/${place.slug}`;
  const mapsDirectionUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  const formatDistance = (distKm?: number) => {
    if (distKm === undefined) return null;
    if (distKm < 1) return `${Math.round(distKm * 1000)} m`;
    return `${distKm.toFixed(1)} km`;
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-[#4FA6A6]/20 hover:border-[#4FA6A6]/60 overflow-hidden card-shadow card-shadow-hover transition-all duration-300">
      {/* Visual Cover / Header banner */}
      <Link href={placeUrl} className="relative aspect-[16/9] w-full overflow-hidden bg-[#0E3B43] block">
        {place.photo_url || place.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.photo_url || place.cover_url}
            alt={place.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0E3B43] via-[#154E58] to-[#1F6E7B] text-white p-6">
            <CategoryIcon className="w-12 h-12 opacity-80 mb-2" style={{ color: meta.color }} />
            <span className="text-xs uppercase tracking-wider font-semibold opacity-75">
              {meta.label}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E3B43]/90 via-black/20 to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border',
                meta.bg
              )}
            >
              <CategoryIcon className="w-3.5 h-3.5" />
              {place.subcategory || meta.label}
            </span>

            {place.verification_status === 'verified' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#0E3B43] shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-[#4FA6A6]" />
                Oficial
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0E3B43]/70 backdrop-blur-md text-teal-200 border border-teal-300/30">
            <Compass className="w-3 h-3" />
            Ponto Cívico
          </span>
        </div>

        {/* Bottom overlay: distance & hours */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          {place.opening_hours ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0E3B43]/85 backdrop-blur-md text-stone-200">
              <Clock className="w-3 h-3 text-teal-300" />
              <span className="truncate max-w-[180px]">{place.opening_hours}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0E3B43]/85 backdrop-blur-md text-stone-300">
              <Building2 className="w-3 h-3 text-teal-300" />
              Utilidade Pública
            </span>
          )}

          {userDistance !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0E3B43]/85 backdrop-blur-md font-bold text-[#F49C6B]">
              <MapPin className="w-3 h-3 text-[#E36845]" />
              {formatDistance(userDistance)}
            </span>
          )}
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
        {/* Title */}
        <Link href={placeUrl} className="group-hover:text-[#4FA6A6] transition-colors mb-1.5">
          <h3 className="font-black text-base sm:text-lg text-[#0E3B43] leading-snug line-clamp-1">
            {place.name}
          </h3>
        </Link>

        {/* Address */}
        <div className="flex items-center gap-1.5 text-xs text-[#537379] mb-2.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#4FA6A6]" />
          <span className="line-clamp-1">
            {place.address}{place.number ? `, ${place.number}` : ''}
            {place.neighborhood?.name ? ` - ${place.neighborhood.name}` : ''}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#537379] line-clamp-2 mb-3.5 flex-1 leading-relaxed">
          {place.short_description || place.description}
        </p>

        {/* Proximity / Anchor hint */}
        {showNearbyPrompt && (
          <div className="mb-4 p-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] flex items-center justify-between text-[11px] text-[#0E3B43]">
            <span className="font-medium text-[#537379]">📍 Ponto de Referência</span>
            <span className="font-bold text-[#4FA6A6] flex items-center gap-1">
              Ver comércio ao redor →
            </span>
          </div>
        )}

        {/* Action Row */}
        <div className="pt-3 border-t border-[#E8E4DA] flex items-center justify-between gap-2">
          <Link
            href={placeUrl}
            className="text-xs font-bold text-[#0E3B43] hover:text-[#4FA6A6] transition-colors inline-flex items-center gap-1"
          >
            <span>Ver Detalhes</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>

          <a
            href={mapsDirectionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 text-teal-300" />
            <span>Rotas</span>
          </a>
        </div>
      </div>
    </div>
  );
};
