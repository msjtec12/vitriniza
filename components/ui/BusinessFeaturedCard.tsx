'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Star, MapPin, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { Business } from '@/types';
import { store } from '@/lib/data/store';
import { buildWhatsAppUrl, getBusinessWhatsAppMessage } from '@/lib/utils';

interface BusinessFeaturedCardProps {
  business: Business;
}

export const BusinessFeaturedCard: React.FC<BusinessFeaturedCardProps> = ({ business }) => {
  const businessUrl = `/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'guaianases'}/${business.slug}`;
  const whatsappUrl = buildWhatsAppUrl(
    business.whatsapp,
    getBusinessWhatsAppMessage(business.name, 'general')
  );

  return (
    <div className="group relative flex flex-col sm:flex-row bg-white rounded-3xl border-2 border-[#4FA6A6]/25 hover:border-[#E36845]/40 overflow-hidden card-shadow card-shadow-hover transition-all duration-300">
      {/* Visual Cover Side */}
      <Link href={businessUrl} className="relative sm:w-2/5 aspect-[16/10] sm:aspect-auto overflow-hidden block bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={business.cover_url}
          alt={business.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#0E3B43]/80 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#E36845] text-white shadow-md">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Destaque do Bairro
          </span>
        </div>
      </Link>

      {/* Info Details Side */}
      <div className="p-5 sm:p-6 sm:w-3/5 flex flex-col justify-between bg-white">
        <div>
          {/* Logo & Category Header */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E8E4DA] shadow-xs bg-white shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-[#4FA6A6] uppercase tracking-wide">
                  {business.category?.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-[#537379]">
                  <MapPin className="w-3 h-3 text-[#E36845]" />
                  <span>{business.neighborhood?.name}, {business.city?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4FA6A6]/15 text-[#0E3B43] font-black text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{business.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Business Name */}
          <Link href={businessUrl} className="group-hover:text-[#E36845] transition-colors block mb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-lg sm:text-xl text-[#0E3B43] leading-snug">
                {business.name}
              </h3>
              {business.is_verified && (
                <ShieldCheck className="w-4 h-4 text-[#4FA6A6] fill-[#4FA6A6]/20" />
              )}
            </div>
          </Link>

          {/* Short description */}
          <p className="text-xs sm:text-sm text-[#537379] line-clamp-2 sm:line-clamp-3 mb-4 leading-relaxed">
            {business.short_description || business.description}
          </p>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-3 pt-3 border-t border-[#E8E4DA]">
          <Link
            href={businessUrl}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-bold border border-[#E8E4DA] transition-all"
          >
            <span>Conhecer vitrine</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#E36845]" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => store.logAnalyticsEvent(business.id, 'whatsapp_click')}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Chamar</span>
          </a>
        </div>
      </div>
    </div>
  );
};
