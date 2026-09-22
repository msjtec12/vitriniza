'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Clock,
  ExternalLink,
  Navigation,
  Building2,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { Place } from '@/types';
import { buildMapsDirectionsUrl, cn } from '@/lib/utils';
import { getPlaceImage, PLACE_CATEGORY_META } from '@/lib/places';

export { PLACE_CATEGORY_META };

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
  const mapsDirectionUrl = buildMapsDirectionsUrl(place);
  const resolvedImage = getPlaceImage(place);
  const [imageUrl, setImageUrl] = useState(resolvedImage.src);
  const [isDefaultImage, setIsDefaultImage] = useState(resolvedImage.isDefault);

  const formatDistance = (distKm?: number) => {
    if (distKm === undefined) return null;
    if (distKm < 1) return `${Math.round(distKm * 1000)} m`;
    return `${distKm.toFixed(1)} km`;
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-[#4FA6A6]/20 hover:border-[#4FA6A6]/60 overflow-hidden card-shadow card-shadow-hover transition-all duration-300">
      {/* Visual Cover / Header banner */}
      <Link href={placeUrl} className="relative aspect-[16/9] w-full overflow-hidden bg-[#0E3B43] block">
        <Image
          src={imageUrl}
          alt={isDefaultImage ? meta.defaultImageAlt : place.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => {
            if (!isDefaultImage) {
              setImageUrl(meta.defaultImage);
              setIsDefaultImage(true);
            }
          }}
          unoptimized
        />
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

            {isDefaultImage && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-white/90 text-[#537379] shadow-sm">
                Imagem ilustrativa
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
          <Link
            href={`${placeUrl}#comercios-proximos`}
            className="mb-4 p-2 rounded-xl bg-[#F8F6F0] hover:bg-teal-50 border border-[#E8E4DA] hover:border-teal-200 flex items-center justify-between text-[11px] text-[#0E3B43] transition-colors"
          >
            <span className="font-medium text-[#537379]">📍 Ponto de Referência</span>
            <span className="font-bold text-[#4FA6A6] flex items-center gap-1">
              Ver comércio ao redor →
            </span>
          </Link>
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
