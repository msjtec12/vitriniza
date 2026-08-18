'use client';

import React from 'react';
import { Tag, Flame, MessageCircle, MapPin, Sparkles } from 'lucide-react';
import { Promotion } from '@/types';
import { store } from '@/lib/data/store';
import { formatCurrency, buildWhatsAppUrl, getBusinessWhatsAppMessage } from '@/lib/utils';

interface PromotionCardProps {
  promotion: Promotion;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion }) => {
  const discountPercent = Math.round(
    ((promotion.original_price - promotion.promo_price) / promotion.original_price) * 100
  );

  const whatsappMessage = getBusinessWhatsAppMessage(
    promotion.business_name || 'Comércio Local',
    'promo',
    promotion.title
  );

  const whatsappUrl = buildWhatsAppUrl(
    promotion.whatsapp || '11999999999',
    whatsappMessage
  );

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.logAnalyticsEvent(promotion.business_id, 'promotion_view');
    store.logAnalyticsEvent(promotion.business_id, 'whatsapp_click');
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-[#4FA6A6]/20 hover:border-[#E36845]/40 overflow-hidden card-shadow card-shadow-hover transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={promotion.image_url}
          alt={promotion.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E3B43]/80 via-transparent to-transparent" />

        {/* Discount Badge in Laranja Coral (#E36845) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#E36845] text-white shadow-md">
            <Flame className="w-3.5 h-3.5 fill-current" />
            {discountPercent}% OFF
          </span>
        </div>

        {/* Business and Neighborhood */}
        <div className="absolute bottom-3 left-3 right-3 text-white text-xs">
          <span className="font-bold block truncate drop-shadow-sm text-sm text-[#F8F6F0]">
            {promotion.business_name}
          </span>
          <div className="flex items-center gap-1 text-[#4FA6A6] mt-0.5 text-[11px] font-semibold">
            <MapPin className="w-3 h-3 text-[#F49C6B]" />
            <span>{promotion.neighborhood_name || 'Guaianases'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          <h4 className="font-black text-sm sm:text-base text-[#0E3B43] line-clamp-2 mb-1.5 leading-snug">
            {promotion.title}
          </h4>

          {promotion.description && (
            <p className="text-xs text-[#537379] line-clamp-2 mb-3 leading-relaxed">
              {promotion.description}
            </p>
          )}

          {/* Pricing Row: Preço em Laranja Coral */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xs text-[#537379] line-through">
              {formatCurrency(promotion.original_price)}
            </span>
            <span className="text-lg sm:text-xl font-black text-[#E36845]">
              {formatCurrency(promotion.promo_price)}
            </span>
          </div>

          {promotion.rules && (
            <div className="text-[11px] text-[#0E3B43] bg-[#4FA6A6]/10 p-2.5 rounded-xl border border-[#4FA6A6]/20 mb-3 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E36845] shrink-0 mt-0.5" />
              <span className="line-clamp-2 font-medium">{promotion.rules}</span>
            </div>
          )}
        </div>

        {/* Action Button: Laranja Coral (#E36845) with Hover Laranja Pêssego (#F49C6B) */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>PEDIR PELO WHATSAPP</span>
        </a>
      </div>
    </div>
  );
};
