'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
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
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/Icons';
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

export default function BusinessShowcasePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'promotions' | 'gallery' | 'reviews'>('products');
  const [isFavorite, setIsFavorite] = useState(false);

  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const found = store.getBusinessBySlug(slug);
    if (!found) return;

    setBusiness(found);
    setReviews(store.getReviews(found.id));
    store.logAnalyticsEvent(found.id, 'business_view');

    // Check favorite
    try {
      const favs = JSON.parse(localStorage.getItem('vitriniza_favorites') || '[]');
      setIsFavorite(favs.includes(found.id));
    } catch {
      // ignore
    }
  }, [slug]);

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#E36845] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-[#537379]">Carregando vitrine do comércio...</p>
      </div>
    );
  }

  const openStatus = store.isBusinessOpenNow(business.hours);
  const businessUrl = `/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'guaianases'}/${business.slug}`;
  const whatsappUrl = buildWhatsAppUrl(
    business.whatsapp,
    getBusinessWhatsAppMessage(business.name, 'general')
  );

  const toggleFavorite = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('vitriniza_favorites') || '[]');
      let updated: string[];
      if (favs.includes(business.id)) {
        updated = favs.filter((id) => id !== business.id);
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

  const handleWhatsAppClick = () => {
    store.logAnalyticsEvent(business.id, 'whatsapp_click');
  };

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  return (
    <div className="pb-16 bg-[#F8F6F0]">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-[#E8E4DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#537379] flex items-center gap-1.5 flex-wrap font-medium">
          <Link href="/" className="hover:text-[#E36845] transition-colors">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/sp/sao-paulo/${business.neighborhood?.slug || 'guaianases'}`} className="hover:text-[#E36845] transition-colors">
            {business.neighborhood?.name || 'Guaianases'}
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
          {business.cover_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={business.cover_url}
                alt={business.name}
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E3B43] via-[#0E3B43]/40 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(#4FA6A6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          )}
        </div>

        {/* Header Profile Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 bg-white rounded-3xl p-5 sm:p-7 border border-[#4FA6A6]/20 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Logo & Main Info */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#4FA6A6]/15 text-[#0E3B43] border border-[#4FA6A6]/30 uppercase tracking-wider">
                    {business.category?.name || 'Profissional / Empresa'}
                  </span>
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

                <h1 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight leading-tight">
                  {business.name}
                </h1>

                {/* Rating & Location */}
                <div className="flex items-center gap-3 text-xs sm:text-sm text-[#537379] flex-wrap mt-1.5 font-medium">
                  <div className="flex items-center gap-1 font-black text-[#0E3B43]">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{business.rating.toFixed(1)}</span>
                    <span className="text-[#537379] font-normal">({business.reviews_count} avaliações)</span>
                  </div>
                  <span>•</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-md text-xs',
                      openStatus.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-600'
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> {openStatus.text}
                  </span>
                  <span>•</span>
                  <span className="text-[#0E3B43] font-bold">📍 {business.neighborhood?.name || 'Guaianases'} - SP</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (WhatsApp, Share, Favorite) */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-black shadow-lg shadow-[#25D366]/20 transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Conversar no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                title="Compartilhar vitrine ou baixar QR Code"
                className="p-3.5 rounded-2xl bg-[#F8F6F0] hover:bg-white border border-[#E8E4DA] text-[#0E3B43] transition-all shadow-2xs cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={toggleFavorite}
                title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all shadow-2xs cursor-pointer',
                  isFavorite
                    ? 'bg-[#E36845] text-white border-[#E36845] shadow-xs'
                    : 'bg-[#F8F6F0] hover:bg-white border-[#E8E4DA] text-[#0E3B43]'
                )}
              >
                <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Side Tabs & Catalog / Right Side Business Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (8 cols): Presentation Banner, Description, Tabs */}
          <div className="lg:col-span-8 space-y-6">
            {/* Official Graphic Presentation Card */}
            {business.cover_url && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#4FA6A6]/20 card-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-wider text-[#0E3B43] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E36845]" />
                    <span>Cartão & Apresentação Oficial</span>
                  </h3>
                  <span className="text-[11px] font-bold text-[#537379]">Vitrine Digital</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#E8E4DA] bg-stone-50 shadow-xs cursor-pointer" onClick={() => setLightboxImg(business.cover_url)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={business.cover_url}
                    alt={`Cartão Profissional - ${business.name}`}
                    className="w-full h-auto object-contain mx-auto max-h-[460px] hover:scale-[1.01] transition-transform"
                  />
                </div>
              </div>
            )}

            {/* Business Description */}
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-3">
              <h2 className="font-black text-base text-[#0E3B43]">Sobre o Estabelecimento / Profissional</h2>

              {business.short_description && business.description && business.short_description !== business.description && (
                <p className="text-xs font-bold text-[#0E3B43] bg-[#4FA6A6]/10 p-3.5 rounded-xl border border-[#4FA6A6]/20 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E36845] shrink-0" />
                  <span>{business.short_description}</span>
                </p>
              )}

              <p className="text-sm text-[#0E3B43]/90 leading-relaxed whitespace-pre-line">
                {business.description || business.short_description || "Comércio local cadastrado na Vitriniza. Clique no botão de WhatsApp acima para consultar produtos, cardápio, horários de atendimento e falar diretamente com nossa equipe!"}
              </p>

              {/* Service Features Badges */}
              {(business.delivery_available || business.takeaway_available || business.dine_in_available || business.is_online_only) && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E8E4DA] flex-wrap text-xs text-[#0E3B43] font-bold">
                  {business.is_online_only && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4FA6A6]/15 text-[#0E3B43] border border-[#4FA6A6]/30">
                      <Globe className="w-4 h-4 text-[#0E3B43]" /> Atendimento 100% Online & Remoto
                    </span>
                  )}
                  {business.dine_in_available && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F6F0] border border-[#4FA6A6]/30">
                      <Building className="w-4 h-4 text-[#4FA6A6]" /> Atendimento Presencial no Local
                    </span>
                  )}
                  {business.delivery_available && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F6F0] border border-[#4FA6A6]/30">
                      <Bike className="w-4 h-4 text-[#E36845]" /> Faz Delivery / Envio em Domicílio
                    </span>
                  )}
                  {business.takeaway_available && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F6F0] border border-[#4FA6A6]/30">
                      <ShoppingBag className="w-4 h-4 text-[#4FA6A6]" /> Aceita Retirada no Local
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-[#E8E4DA] card-shadow overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0',
                  activeTab === 'products'
                    ? 'bg-[#E36845] text-white shadow-xs'
                    : 'text-[#537379] hover:text-[#0E3B43] hover:bg-stone-50'
                )}
              >
                <span>Produtos & Serviços</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10">
                  {business.products?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('promotions')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0',
                  activeTab === 'promotions'
                    ? 'bg-[#E36845] text-white shadow-xs'
                    : 'text-[#537379] hover:text-[#0E3B43] hover:bg-stone-50'
                )}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Ofertas</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10">
                  {business.promotions?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0',
                  activeTab === 'gallery'
                    ? 'bg-[#E36845] text-white shadow-xs'
                    : 'text-[#537379] hover:text-[#0E3B43] hover:bg-stone-50'
                )}
              >
                <span>Fotos & Galeria</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0',
                  activeTab === 'reviews'
                    ? 'bg-[#E36845] text-white shadow-xs'
                    : 'text-[#537379] hover:text-[#0E3B43] hover:bg-stone-50'
                )}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Avaliações ({reviews.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: PRODUCTS */}
            {activeTab === 'products' && (
              <div>
                {business.products && business.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {business.products.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        businessName={business.name}
                        businessWhatsApp={business.whatsapp}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E4DA]">
                    <ShoppingBag className="w-10 h-10 text-[#537379] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-[#0E3B43]">Nenhum produto cadastrado no momento.</p>
                    <p className="text-xs text-[#537379] mt-1">Consulte o cardápio completo diretamente pelo WhatsApp.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PROMOTIONS */}
            {activeTab === 'promotions' && (
              <div>
                {business.promotions && business.promotions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {business.promotions.map((promo) => (
                      <PromotionCard key={promo.id} promotion={promo} />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E4DA]">
                    <Flame className="w-10 h-10 text-[#537379] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-[#0E3B43]">Nenhuma oferta ativa hoje.</p>
                    <p className="text-xs text-[#537379] mt-1">Fale com o estabelecimento para saber de descontos especiais.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: GALLERY */}
            {activeTab === 'gallery' && (
              <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-4">
                <h3 className="font-black text-base text-[#0E3B43]">Fotos do Estabelecimento</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setLightboxImg(business.cover_url)}
                    className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-stone-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={business.cover_url} alt="Fachada" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  {business.gallery?.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setLightboxImg(img.image_url)}
                      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-stone-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image_url} alt={img.caption || 'Foto'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-black text-[#0E3B43]">
                      {business.rating.toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5 text-amber-400 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-[#537379]">Baseado em {reviews.length} avaliações reais</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsReviewOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Escrever Avaliação
                  </button>
                </div>

                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <ReviewCard key={rev.id} review={rev} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Address & Leaflet Map, Contact, Opening Hours, Payment, Claim */}
          <div className="lg:col-span-4 space-y-6">
            {/* Location & Map Card or Online Service Card */}
            {business.is_online_only ? (
              <div className="bg-white rounded-3xl p-6 border-2 border-[#4FA6A6]/30 card-shadow space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43] mx-auto flex items-center justify-center">
                  <Globe className="w-7 h-7 text-[#0E3B43]" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#4FA6A6]/20 text-[#0E3B43] font-black text-[11px] uppercase tracking-wider">
                    🌐 Atendimento 100% Online & Remoto
                  </span>
                  <h3 className="font-black text-base text-[#0E3B43] mt-2.5">Sem Endereço Físico Necessário</h3>
                  <p className="text-xs text-[#537379] mt-1.5 leading-relaxed">
                    Este profissional atende de forma digital (WhatsApp, Reunião Online, E-mail e Entrega) em toda a região de <strong>{business.neighborhood?.name || 'São Paulo'}</strong> e Brasil.
                  </p>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Solicitar Orçamento no WhatsApp</span>
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-4">
                <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#E36845]" />
                  <span>Localização & Endereço</span>
                </h3>

                <p className="text-xs text-[#0E3B43]/85 leading-relaxed">
                  {business.address}, {business.number}
                  {business.complement && ` (${business.complement})`} - {business.neighborhood?.name}, {business.city?.name} - SP
                  <br />
                  <span className="text-[#537379]">CEP: {business.postal_code}</span>
                </p>

                {/* Leaflet Map Embed */}
                <div className="h-44 rounded-2xl overflow-hidden border border-[#E8E4DA] bg-stone-100">
                  <LeafletMap
                    businesses={[business]}
                    center={[business.latitude, business.longitude]}
                    zoom={15}
                    height="100%"
                  />
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${business.name} ${business.address} ${business.number} Guaianases SP`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => store.logAnalyticsEvent(business.id, 'map_click')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-bold border border-[#4FA6A6]/30 transition-all"
                >
                  <span>Como chegar (Abrir no GPS)</span>
                </a>
              </div>
            )}

            {/* Direct Contacts */}
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-3">
              <h3 className="font-black text-base text-[#0E3B43] mb-2">Canais de Atendimento</h3>

              <a
                href={`tel:${business.phone || business.whatsapp}`}
                onClick={() => store.logAnalyticsEvent(business.id, 'phone_click')}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F6F0] hover:bg-white border border-[#E8E4DA] transition-colors text-xs text-[#0E3B43]"
              >
                <Phone className="w-4 h-4 text-[#4FA6A6]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#537379] uppercase font-bold">Telefone Fixo / Celular</span>
                  <span className="font-black text-sm">{formatPhone(business.phone || business.whatsapp)}</span>
                </div>
              </a>

              {business.instagram && (
                <a
                  href={`https://instagram.com/${business.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => store.logAnalyticsEvent(business.id, 'instagram_click')}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F6F0] hover:bg-white border border-[#E8E4DA] transition-colors text-xs text-[#0E3B43]"
                >
                  <InstagramIcon className="w-4 h-4 text-[#E36845]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#537379] uppercase font-bold">Instagram</span>
                    <span className="font-bold">@{business.instagram}</span>
                  </div>
                </a>
              )}

              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F6F0] hover:bg-white border border-[#E8E4DA] transition-colors text-xs text-[#0E3B43]"
                >
                  <Globe className="w-4 h-4 text-[#4FA6A6]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#537379] uppercase font-bold">Website Oficial</span>
                    <span className="font-bold truncate">{business.website}</span>
                  </div>
                </a>
              )}
            </div>

            {/* Operating Hours Table */}
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-3">
              <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4FA6A6]" />
                <span>Horários de Funcionamento</span>
              </h3>

              <div className="space-y-1.5 text-xs">
                {business.hours?.map((h) => {
                  const isToday = new Date().getDay() === h.day_of_week;
                  return (
                    <div
                      key={h.day_of_week}
                      className={cn(
                        'flex items-center justify-between py-1.5 px-2.5 rounded-xl',
                        isToday ? 'bg-[#4FA6A6]/15 border border-[#4FA6A6]/30 font-black text-[#0E3B43]' : 'text-[#537379]'
                      )}
                    >
                      <span>{dayNames[h.day_of_week]}</span>
                      <span>
                        {h.is_closed ? (
                          <span className="text-stone-400">Fechado</span>
                        ) : (
                          `${h.open_time} - ${h.close_time}`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Official Store QR Code Display */}
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow">
              <StoreQRCode
                businessName={business.name}
                businessSlug={business.slug}
                businessLogoUrl={business.logo_url}
                businessUrl={businessUrl}
                neighborhoodName={business.neighborhood?.name}
                categoryName={business.category?.name}
                size={140}
                variant="display_card"
              />
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-2.5">
              <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#4FA6A6]" />
                <span>Formas de Pagamento</span>
              </h3>

              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {business.payment_methods?.map((pm) => (
                  <span
                    key={pm}
                    className="px-2.5 py-1 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] font-semibold"
                  >
                    {pm}
                  </span>
                ))}
              </div>
            </div>

            {/* Claim Profile Box ("Esta empresa é sua?") */}
            <div className="bg-[#F8F6F0] rounded-3xl p-6 border border-[#4FA6A6]/30 text-center space-y-3">
              <Building className="w-8 h-8 text-[#0E3B43] mx-auto" />
              <div>
                <h4 className="font-black text-sm text-[#0E3B43]">Esta empresa é sua?</h4>
                <p className="text-xs text-[#537379] mt-1 leading-relaxed">
                  Reivindique a posse do perfil para atualizar fotos, cardápio, horários e responder avaliações.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsClaimOpen(true)}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-[#0E3B43] hover:text-white border border-[#0E3B43]/30 text-xs font-bold text-[#0E3B43] transition-all shadow-2xs"
              >
                Reivindicar este perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxImg} alt="Foto ampliada" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        businessName={business.name}
        businessSlug={business.slug}
        businessUrl={businessUrl}
        businessId={business.id}
        businessLogoUrl={business.logo_url}
        neighborhoodName={business.neighborhood?.name}
        categoryName={business.category?.name}
      />

      {/* Claim Modal */}
      <ClaimModal
        isOpen={isClaimOpen}
        onClose={() => setIsClaimOpen(false)}
        businessId={business.id}
        businessName={business.name}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        businessId={business.id}
        businessName={business.name}
        onReviewSubmitted={() => setReviews(store.getReviews(business.id))}
      />
    </div>
  );
}
