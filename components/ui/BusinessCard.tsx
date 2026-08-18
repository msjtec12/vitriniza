'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  Heart,
  MessageCircle,
  Bike,
  ShoppingBag,
} from 'lucide-react';
import { Business } from '@/types';
import { store } from '@/lib/data/store';
import { buildWhatsAppUrl, getBusinessWhatsAppMessage, cn } from '@/lib/utils';

interface BusinessCardProps {
  business: Business;
  userDistance?: number;
  onFavoriteToggle?: (isFav: boolean) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  userDistance,
  onFavoriteToggle,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const openStatus = store.isBusinessOpenNow(business.hours);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('vitriniza_favorites') || '[]');
      setIsFavorite(favs.includes(business.id));
    } catch {
      // ignore
    }
  }, [business.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('vitriniza_favorites') || '[]');
      let updated: string[];
      if (favs.includes(business.id)) {
        updated = favs.filter((id) => id !== business.id);
        setIsFavorite(false);
        onFavoriteToggle?.(false);
      } else {
        updated = [...favs, business.id];
        setIsFavorite(true);
        onFavoriteToggle?.(true);
        store.logAnalyticsEvent(business.id, 'favorite');
      }
      localStorage.setItem('vitriniza_favorites', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.logAnalyticsEvent(business.id, 'whatsapp_click');
  };

  const businessUrl = `/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'guaianases'}/${business.slug}`;
  const whatsappUrl = buildWhatsAppUrl(
    business.whatsapp,
    getBusinessWhatsAppMessage(business.name, 'general')
  );

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-[#4FA6A6]/20 hover:border-[#E36845]/50 overflow-hidden card-shadow card-shadow-hover transition-all duration-300">
      {/* Cover Image Container */}
      <Link href={businessUrl} className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={business.cover_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80'}
          alt={business.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E3B43]/80 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {business.is_featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E36845] text-white shadow-sm">
                <Sparkles className="w-3 h-3 fill-current" />
                Destaque
              </span>
            )}
            {business.category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#F8F6F0]/95 backdrop-blur-md text-[#0E3B43] shadow-sm border border-[#E8E4DA]">
                {business.category.name}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90',
              isFavorite
                ? 'bg-[#E36845] text-white shadow-md'
                : 'bg-[#0E3B43]/50 text-white hover:bg-white hover:text-[#E36845]'
            )}
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
          </button>
        </div>

        {/* Bottom overlay status */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold backdrop-blur-md',
              openStatus.isOpen
                ? 'bg-[#4FA6A6] text-white'
                : 'bg-[#0E3B43]/80 text-stone-200'
            )}
          >
            <Clock className="w-3 h-3" />
            {openStatus.isOpen ? 'Aberto agora' : 'Fechado'}
          </span>

          {userDistance !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0E3B43]/80 backdrop-blur-md font-bold text-[#F49C6B]">
              <MapPin className="w-3 h-3 text-[#E36845]" />
              {userDistance} km
            </span>
          )}
        </div>
      </Link>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
        {/* Title & Verified */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link href={businessUrl} className="group-hover:text-[#E36845] transition-colors">
            <h3 className="font-black text-base sm:text-lg text-[#0E3B43] leading-snug line-clamp-1">
              {business.name}
            </h3>
          </Link>
          {business.is_verified && (
            <span title="Estabelecimento Verificado" className="text-[#4FA6A6] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 fill-[#4FA6A6]/20" />
            </span>
          )}
        </div>

        {/* Rating & Proximity / Neighborhood badge in Cyan 15% opacity + Dark Teal text */}
        <div className="flex items-center gap-1.5 text-xs text-[#537379] mb-2.5 flex-wrap">
          <div className="flex items-center gap-1 font-black text-[#0E3B43]">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{business.rating.toFixed(1)}</span>
          </div>
          <span>•</span>
          <span>({business.reviews_count} avaliações)</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-md bg-[#4FA6A6]/15 text-[#0E3B43] font-bold text-[11px]">
            {business.neighborhood?.name || 'Guaianases'}
          </span>
        </div>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-[#537379] line-clamp-2 mb-3.5 flex-1 leading-relaxed">
          {business.short_description || business.description}
        </p>

        {/* Service badges */}
        <div className="flex items-center gap-2 mb-4 text-[11px] flex-wrap">
          {business.delivery_available && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F8F6F0] border border-[#4FA6A6]/30 text-[#0E3B43] font-semibold">
              <Bike className="w-3 h-3 text-[#E36845]" /> Delivery
            </span>
          )}
          {business.takeaway_available && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F8F6F0] border border-[#4FA6A6]/30 text-[#0E3B43] font-semibold">
              <ShoppingBag className="w-3 h-3 text-[#4FA6A6]" /> Retirada
            </span>
          )}
        </div>

        {/* Bottom CTA Row: Ver Loja + WhatsApp in Coral with Peach Hover */}
        <div className="pt-3 border-t border-[#E8E4DA] flex items-center justify-between gap-2">
          <Link
            href={businessUrl}
            className="text-xs font-bold text-[#0E3B43] hover:text-[#E36845] transition-colors"
          >
            Ver Loja →
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
