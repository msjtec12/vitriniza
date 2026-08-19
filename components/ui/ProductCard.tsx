'use client';

import React from 'react';
import { WhatsAppSolidIcon } from '@/components/ui/Icons';
import { Product } from '@/types';
import { store } from '@/lib/data/store';
import { formatCurrency, buildWhatsAppUrl, getBusinessWhatsAppMessage } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  businessName: string;
  businessWhatsApp: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  businessName,
  businessWhatsApp,
}) => {
  const whatsappMessage = getBusinessWhatsAppMessage(businessName, 'product', product.name);
  const whatsappUrl = buildWhatsAppUrl(businessWhatsApp, whatsappMessage);

  const handleClick = () => {
    store.logAnalyticsEvent(product.business_id, 'product_view');
    store.logAnalyticsEvent(product.business_id, 'whatsapp_click');
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#4FA6A6]/20 hover:border-[#E36845]/40 overflow-hidden card-shadow card-shadow-hover transition-all duration-300">
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        {product.category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 backdrop-blur-md text-[#0E3B43] shadow-xs border border-[#E8E4DA]">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          <h4 className="font-black text-sm text-[#0E3B43] line-clamp-1 mb-1">
            {product.name}
          </h4>
          {product.description && (
            <p className="text-xs text-[#537379] line-clamp-2 mb-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div>
          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-2.5">
            {product.promo_price ? (
              <>
                <span className="text-xs text-[#537379] line-through">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-base font-black text-[#E36845]">
                  {formatCurrency(product.promo_price)}
                </span>
              </>
            ) : (
              <span className="text-base font-black text-[#E36845]">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* CTA: Laranja Coral (#E36845) with Hover Laranja Pêssego (#F49C6B) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <WhatsAppSolidIcon className="w-3.5 h-3.5" />
            <span>Tenho interesse</span>
          </a>
        </div>
      </div>
    </div>
  );
};
