'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Globe,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Share2,
  Heart,
  Bike,
  ShoppingBag,
  Utensils,
  CreditCard,
  Building,
  HelpCircle,
  ChevronRight,
  Flame,
  Award,
  Navigation,
  X,
  Maximize2,
  Store,
} from 'lucide-react';
import { InstagramIcon, WhatsAppSolidIcon } from '@/components/ui/Icons';
import { store } from '@/lib/data/store';
import { Business, Review } from '@/types';
import { ProductCard } from '@/components/ui/ProductCard';
import { PromotionCard } from '@/components/ui/PromotionCard';
import { ReviewCard } from '@/components/ui/ReviewCard';
import { LeafletMap } from '@/components/ui/LeafletMap';
import { StoreQRCode } from '@/components/ui/StoreQRCode';
import { ShareModal } from '@/components/ui/ShareModal';
import { ClaimModal } from '@/components/ui/ClaimModal';
import { ReviewModal } from '@/components/ui/ReviewModal';
import { buildWhatsAppUrl, getBusinessWhatsAppMessage, formatPhone, cn } from '@/lib/utils';

interface BusinessShowcaseClientProps {
  initialBusiness?: Business | null;
  initialReviews?: Review[];
  slug?: string;
}

export const BusinessShowcaseClient: React.FC<BusinessShowcaseClientProps> = ({
  initialBusiness,
  initialReviews = [],
  slug,
}) => {
  const [business, setBusiness] = useState<Business | null>(initialBusiness || null);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<'products' | 'promotions' | 'gallery' | 'reviews'>('products');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHydrating, setIsHydrating] = useState(!initialBusiness);

  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Client hydration & reactive store sync for dynamic businesses (e.g. Konnexy)
  useEffect(() => {
    if (!slug) return;

    const syncCurrentBusiness = () => {
      const found = store.getBusinessBySlug(slug);
      if (found) {
        setBusiness(found);
        setReviews(store.getReviews(found.id));
      }
      setIsHydrating(false);
    };

    syncCurrentBusiness();
    store.ensureCloudSynced().then(syncCurrentBusiness);
    const unsub = store.subscribe(syncCurrentBusiness);
    return () => unsub();
  }, [slug]);

  useEffect(() => {
    if (business) {
      store.logAnalyticsEvent(business.id, 'business_view');
      try {
        const favs = JSON.parse(localStorage.getItem('vitriniza_favorites') || '[]');
        setIsFavorite(favs.includes(business.id));
      } catch {
        // ignore
      }
    }
  }, [business?.id]);

  if (!business) {
    if (isHydrating) {
      return (
        <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 border-3 border-[#0E3B43] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#537379]">Carregando vitrine...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#4FA6A6]/20 card-shadow text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0E3B43] text-white flex items-center justify-center mx-auto shadow-md">
            <Store className="w-8 h-8 text-[#4FA6A6]" />
          </div>
          <h3 className="font-black text-xl text-[#0E3B43]">Vitrine não encontrada</h3>
          <p className="text-xs text-[#537379] leading-relaxed">
            O comércio ou profissional procurado não está cadastrado ou pode ter alterado seu link na Vitriniza.
          </p>
          <div className="pt-2">
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <span>Explorar Comércios & Bairros</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const openStatus = store.isBusinessOpenNow(business.hours);
  const businessUrl = `/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'bairro'}/${business.slug}`;
  const generalWhatsappUrl = buildWhatsAppUrl(
    business.whatsapp,
    getBusinessWhatsAppMessage(business.name, 'general')
  );

  const toggleFavorite = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('vitriniza_favorites') || '[]');
      let updated: string[];
      if (favs.includes(business.id)) {
        updated = favs.filter((id: string) => id !== business.id);
        setIsFavorite(false);
      } else {
        updated = [...favs, business.id];
        setIsFavorite(true);
        store.logAnalyticsEvent(business.id, 'favorite');
      }
      localStorage.setItem('vitriniza_favorites', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleWhatsAppClick = (origin: 'general' | 'product' | 'promotion' = 'general', itemName?: string) => {
    store.logAnalyticsEvent(business.id, 'whatsapp_click', { origin, itemName });
  };

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const hasPhysicalAddress = !business.is_online_only && business.address && business.address.trim().length > 0;

  const addressQueryString = `${business.address || ''}, ${business.number || ''}, ${business.neighborhood?.name || ''}, ${business.city?.name || 'São Paulo'} - ${business.state_id?.toUpperCase() || 'SP'}, CEP ${business.postal_code || ''}`;
  const gpsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.name} ${business.address} ${business.number} ${business.neighborhood?.name || ''} ${business.city?.name || 'São Paulo'} ${business.state_id?.toUpperCase() || 'SP'}`
  )}`;

  return (
    <div className="pb-24 lg:pb-16 bg-[#F8F6F0]">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-[#E8E4DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#537379] flex items-center gap-1.5 flex-wrap font-medium">
          <Link href="/" className="hover:text-[#E36845] transition-colors">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/${(business.state_id || 'sp').toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'bairro'}`} className="hover:text-[#E36845] transition-colors">
            {business.neighborhood?.name || 'Bairro'}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/buscar?categoria=${business.category?.slug}`} className="hover:text-[#E36845] transition-colors">
            {business.category?.name}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-bold text-[#0E3B43] truncate">{business.name}</span>
        </div>
      </div>

      {/* Hero Cover & Header */}
      <div className="relative">
        {/* Cover Background Header */}
        <div className="h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-gradient-to-r from-[#0E3B43] via-[#154E58] to-[#0E3B43] relative">
          {business.cover_url && !business.cover_url.includes('photo-1513104890138-7c749659a591') ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={business.cover_url}
                alt={business.name}
                className="w-full h-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E3B43] via-[#0E3B43]/40 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E3B43] via-[#154E58] to-[#0E3B43] flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#4FA6A6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            </div>
          )}
        </div>

        {/* Header Profile Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 bg-white rounded-3xl p-5 sm:p-7 border border-[#4FA6A6]/20 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Logo & Main Info */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-[#0E3B43] shrink-0 p-2 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    business.logo_url && !business.logo_url.includes('photo-1513104890138-7c749659a591')
                      ? business.logo_url
                      : '/logo.png'
                  }
                  alt={business.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#4FA6A6]/15 text-[#0E3B43] border border-[#4FA6A6]/30 uppercase tracking-wider">
                    {business.category?.name || 'Profissional / Empresa'}
                  </span>

                  {business.is_founder && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                      <Award className="w-3.5 h-3.5 fill-current" /> Negócio Fundador
                    </span>
                  )}

                  {business.is_featured && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#E36845] text-white shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 fill-current" /> Destaque
                    </span>
                  )}

                  {business.is_verified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#0E3B43] text-white shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4FA6A6]" /> Verificado ✓
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight">
                  {business.name}
                </h1>

                {/* Rating & Location */}
                <div className="flex items-center gap-3 text-xs text-[#537379] mt-1.5 flex-wrap font-medium">
                  {business.rating > 0 && (
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-900 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{business.rating.toFixed(1)}</span>
                      <span className="text-stone-400">({reviews.length} avaliações)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 font-semibold text-[#0E3B43]">
                    <MapPin className="w-3.5 h-3.5 text-[#E36845]" />
                    <span>{[business.neighborhood?.name, business.city?.name || 'SP'].filter(Boolean).join(' - ')}</span>
                  </div>

                  {openStatus && (
                    <div className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                      openStatus.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    )}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{openStatus.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex flex-row md:flex-col items-center md:items-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
              <a
                href={generalWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleWhatsAppClick('general')}
                className="px-5 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <WhatsAppSolidIcon className="w-4 h-4 fill-white" />
                <span>Conversar no WhatsApp</span>
              </a>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                    isFavorite
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-[#E8E4DA] text-[#0E3B43] hover:bg-stone-50'
                  )}
                  title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Heart className={cn('w-4 h-4', isFavorite ? 'fill-rose-500 text-rose-500' : '')} />
                  <span className="hidden sm:inline">{isFavorite ? 'Salvo' : 'Favoritar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="p-2.5 rounded-xl bg-white border border-[#E8E4DA] text-[#0E3B43] hover:bg-stone-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Compartilhar vitrine"
                >
                  <Share2 className="w-4 h-4 text-[#4FA6A6]" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Description, Tabs & Catalog */}
        <div className="lg:col-span-8 space-y-8">
          {/* Business Description Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-4">
            <h3 className="font-black text-lg text-[#0E3B43] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#E36845]" />
              <span>Sobre o Estabelecimento</span>
            </h3>
            <p className="text-sm text-[#0E3B43]/85 leading-relaxed whitespace-pre-line font-medium">
              {business.description || business.short_description || 'Comércio local cadastrado na Vitriniza com atendimento e qualidade no bairro.'}
            </p>

            {/* Modalities & Attributes */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {business.delivery_available && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <Bike className="w-3.5 h-3.5" /> Faz Delivery
                </span>
              )}
              {business.takeaway_available && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                  <ShoppingBag className="w-3.5 h-3.5" /> Aceita Retirada
                </span>
              )}
              {business.dine_in_available && !business.is_online_only && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                  <Utensils className="w-3.5 h-3.5" /> Atendimento Presencial
                </span>
              )}
              {business.is_online_only && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold">
                  <Globe className="w-3.5 h-3.5" /> Atendimento 100% Online
                </span>
              )}
            </div>
          </div>

          {/* Catalog / Navigation Tabs */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-6">
            <div className="flex items-center gap-2 border-b border-[#E8E4DA] pb-3 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2',
                  activeTab === 'products'
                    ? 'bg-[#0E3B43] text-white shadow-sm'
                    : 'text-[#537379] hover:bg-stone-100'
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Produtos & Serviços ({business.products?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('promotions')}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2',
                  activeTab === 'promotions'
                    ? 'bg-[#E36845] text-white shadow-sm'
                    : 'text-[#537379] hover:bg-stone-100'
                )}
              >
                <Flame className="w-4 h-4" />
                <span>Ofertas ({business.promotions?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2',
                  activeTab === 'gallery'
                    ? 'bg-[#0E3B43] text-white shadow-sm'
                    : 'text-[#537379] hover:bg-stone-100'
                )}
              >
                <Sparkles className="w-4 h-4" />
                <span>Galeria de Fotos ({business.gallery?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2',
                  activeTab === 'reviews'
                    ? 'bg-[#0E3B43] text-white shadow-sm'
                    : 'text-[#537379] hover:bg-stone-100'
                )}
              >
                <Star className="w-4 h-4" />
                <span>Avaliações ({reviews.length})</span>
              </button>
            </div>

            {/* TAB 1: PRODUCTS & SERVICES */}
            {activeTab === 'products' && (
              <div>
                {business.products && business.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {business.products.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        businessWhatsApp={business.whatsapp}
                        businessName={business.name}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-[#537379] space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto opacity-40 text-[#4FA6A6]" />
                    <p className="font-bold text-sm">Catálogo de produtos em atualização</p>
                    <p className="text-xs max-w-sm mx-auto">
                      Entre em contato direto pelo WhatsApp para consultar opções e valores atualizados.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PROMOTIONS */}
            {activeTab === 'promotions' && (
              <div>
                {business.promotions && business.promotions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {business.promotions.map((promo) => (
                      <PromotionCard key={promo.id} promotion={promo} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-[#537379] space-y-2">
                    <Flame className="w-10 h-10 mx-auto opacity-40 text-[#E36845]" />
                    <p className="font-bold text-sm">Nenhuma promoção ativa no momento</p>
                    <p className="text-xs max-w-sm mx-auto">
                      Fique atento! Novas ofertas do bairro são publicadas semanalmente neste perfil.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: GALLERY */}
            {activeTab === 'gallery' && (
              <div>
                {business.gallery && business.gallery.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {business.gallery.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setLightboxImg(img.image_url)}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-[#E8E4DA] bg-stone-100 group cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.image_url}
                          alt={img.caption || 'Foto do comércio'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-6 h-6" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-[#537379] space-y-2">
                    <Sparkles className="w-10 h-10 mx-auto opacity-40 text-[#4FA6A6]" />
                    <p className="font-bold text-sm">Galeria de fotos em breve</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 bg-[#F8F6F0] p-4 rounded-2xl border border-[#E8E4DA]">
                  <div>
                    <div className="text-2xl font-black text-[#0E3B43] flex items-center gap-2">
                      <span>{business.rating.toFixed(1)}</span>
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    </div>
                    <p className="text-xs text-[#537379]">Baseado em {reviews.length} avaliações de moradores</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReviewOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Avaliar Negócio
                  </button>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <ReviewCard key={rev.id} review={rev} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center text-[#537379] py-6">
                    Seja o primeiro a avaliar {business.name}!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Address, Map, Hours, Contacts & QR Code */}
        <div className="lg:col-span-4 space-y-6">
          {/* Location & Map Card (Only if physical address exists) */}
          {hasPhysicalAddress ? (
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-4">
              <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E36845]" />
                <span>Localização & Endereço</span>
              </h3>

              <p className="text-xs text-[#0E3B43]/85 leading-relaxed font-medium">
                {business.address}, {business.number}
                {business.complement && ` (${business.complement})`} - {business.neighborhood?.name || 'Bairro'}, {business.city?.name || 'São Paulo'} - {business.state_id?.toUpperCase() || 'SP'}
                <br />
                <span className="text-[#537379]">CEP: {business.postal_code}</span>
              </p>

              {/* Map Embed */}
              <div className="h-48 rounded-2xl overflow-hidden border border-[#E8E4DA] bg-stone-100 shadow-inner">
                <LeafletMap
                  businesses={[business]}
                  center={[business.latitude, business.longitude]}
                  addressQuery={addressQueryString}
                  zoom={16}
                  height="100%"
                />
              </div>

              <a
                href={gpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => store.logAnalyticsEvent(business.id, 'map_click')}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-bold border border-[#4FA6A6]/30 transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-[#E36845]" />
                <span>Como chegar (Abrir no GPS)</span>
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-3">
              <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#4FA6A6]" />
                <span>Área de Atendimento</span>
              </h3>
              <p className="text-xs text-[#537379] leading-relaxed">
                Este profissional realiza atendimentos 100% online ou deslocamento direto ao endereço do cliente em <strong>{business.neighborhood?.name ? `${business.neighborhood.name} e região` : 'sua região e cidades vizinhas'}</strong>.
              </p>
            </div>
          )}

          {/* Opening Hours Card */}
          {business.hours && business.hours.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-4">
              <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E36845]" />
                <span>Horário de Funcionamento</span>
              </h3>

              <div className="space-y-2 text-xs divide-y divide-stone-100">
                {business.hours.map((h) => (
                  <div key={h.day_of_week} className="flex items-center justify-between pt-2">
                    <span className="font-medium text-[#537379]">{dayNames[h.day_of_week]}</span>
                    <span className={cn('font-bold', h.is_closed ? 'text-rose-500' : 'text-[#0E3B43]')}>
                      {h.is_closed ? 'Fechado' : `${h.open_time} às ${h.close_time}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Channels Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-4">
            <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#4FA6A6]" />
              <span>Canais de Atendimento</span>
            </h3>

            <div className="space-y-3 text-xs">
              {business.whatsapp && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wide">
                      <WhatsAppSolidIcon className="w-4 h-4 fill-emerald-600" />
                      <span>WhatsApp de Atendimento</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-800 text-[10px] font-black">
                      Oficial
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-sm font-black text-[#0E3B43] font-mono">
                      {formatPhone(business.whatsapp)}
                    </span>
                    <a
                      href={buildWhatsAppUrl(
                        business.whatsapp,
                        `Olá! Encontrei o perfil de ${business.name} na Vitriniza e gostaria de atendimento.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => store.logAnalyticsEvent(business.id, 'whatsapp_click')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <WhatsAppSolidIcon className="w-3.5 h-3.5 fill-white" />
                      <span>Conversar</span>
                    </a>
                  </div>
                </div>
              )}

              {business.phone && business.phone !== business.whatsapp && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
                  <span className="font-bold text-[#537379]">Telefone Adicional</span>
                  <a
                    href={`tel:${business.phone.replace(/\D/g, '')}`}
                    onClick={() => store.logAnalyticsEvent(business.id, 'phone_click')}
                    className="font-black text-[#0E3B43] hover:text-[#E36845]"
                  >
                    {formatPhone(business.phone)}
                  </a>
                </div>
              )}

              {business.instagram && (
                <a
                  href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => store.logAnalyticsEvent(business.id, 'instagram_click')}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 text-[#0E3B43] font-bold hover:opacity-95 transition-opacity"
                >
                  <span className="flex items-center gap-2">
                    <InstagramIcon className="w-4 h-4 text-pink-600" />
                    <span>Instagram</span>
                  </span>
                  <span className="text-purple-700">@{business.instagram.replace('@', '')}</span>
                </a>
              )}

              {business.payment_methods && business.payment_methods.length > 0 && (
                <div className="pt-2">
                  <span className="font-bold text-[#537379] block mb-2">Formas de Pagamento Aceitas:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {business.payment_methods.map((method, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-stone-100 text-[11px] font-bold text-[#0E3B43] border border-stone-200">
                        💳 {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Store QR Code Card */}
          <StoreQRCode
            businessName={business.name}
            businessSlug={business.slug}
            businessLogoUrl={business.logo_url}
            businessUrl={businessUrl}
            neighborhoodName={business.neighborhood?.name}
            categoryName={business.category?.name}
          />

          {/* Claim Business Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsClaimOpen(true)}
              className="text-xs text-[#537379] hover:text-[#E36845] font-bold underline transition-colors cursor-pointer"
            >
              É o proprietário deste negócio? Reivindique este perfil.
            </button>
          </div>
        </div>
      </div>

      {/* STICKY MOBILE BOTTOM BAR (Requirement #35) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E4DA] p-3 shadow-2xl flex items-center justify-between gap-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <a
          href={generalWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleWhatsAppClick('general')}
          className="flex-1 py-3 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <WhatsAppSolidIcon className="w-4 h-4 fill-white" />
          <span>WhatsApp</span>
        </a>

        {hasPhysicalAddress ? (
          <a
            href={gpsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => store.logAnalyticsEvent(business.id, 'map_click')}
            className="flex-1 py-3 px-3 rounded-2xl bg-[#0E3B43] hover:bg-[#154E58] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Como chegar</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className="flex-1 py-3 px-3 rounded-2xl bg-[#0E3B43] hover:bg-[#154E58] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#4FA6A6]" />
            <span>Ver produtos</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-[#0E3B43] font-bold text-xs flex items-center justify-center cursor-pointer"
          title="Compartilhar"
        >
          <Share2 className="w-4 h-4 text-[#4FA6A6]" />
        </button>
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxImg} alt="Visualização" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* MODALS */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        businessId={business.id}
        businessName={business.name}
        businessSlug={business.slug}
        businessUrl={businessUrl}
        businessLogoUrl={business.logo_url}
        businessCoverUrl={business.cover_url}
        businessDescription={business.short_description || business.description}
        neighborhoodName={business.neighborhood?.name}
        categoryName={business.category?.name}
      />
      <ClaimModal
        isOpen={isClaimOpen}
        onClose={() => setIsClaimOpen(false)}
        businessId={business.id}
        businessName={business.name}
      />
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        businessId={business.id}
        businessName={business.name}
        onReviewSubmitted={() => setReviews(store.getReviews(business.id))}
      />
    </div>
  );
};
