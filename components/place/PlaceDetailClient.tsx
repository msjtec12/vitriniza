'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Navigation,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Share2,
  Compass,
  Store,
  ShieldCheck,
  Info,
  Check,
} from 'lucide-react';
import type { Business, Place } from '@/types';
import { store } from '@/lib/data/store';
import { getPlaceCategoryMeta } from '@/lib/places';
import { BusinessCard } from '@/components/ui/BusinessCard';

const LeafletMap = dynamic(
  () => import('@/components/ui/LeafletMap').then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] bg-stone-100 rounded-2xl flex flex-col items-center justify-center text-xs text-[#537379] gap-2 border border-[#E8E4DA]">
        <div className="w-6 h-6 border-2 border-[#0E3B43] border-t-transparent rounded-full animate-spin" />
        <span>Carregando mapa interativo do entorno...</span>
      </div>
    ),
  }
);

interface PlaceDetailClientProps {
  place: Place;
}

export function PlaceDetailClient({ place }: PlaceDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<{ business: Business; distanceKm: number }[]>([]);

  const meta = getPlaceCategoryMeta(place.category_group);
  const CategoryIcon = meta.icon;

  useEffect(() => {
    try {
      const near = store.getBusinessesNearPlace(place.slug, 3);
      setNearbyBusinesses(near);
    } catch {
      // Fallback safe
    }
  }, [place.slug]);

  const handleShare = async () => {
    const shareData = {
      title: `${place.name} | Guia Vitriniza`,
      text: `${place.name} - ${place.subcategory || meta.label} em ${place.neighborhood?.name || 'São Paulo'}. Confira horários, rotas e serviços no entorno.`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or failed
      }
    }

    // Fallback: Copy link to clipboard
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  const mapsDirectionUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  return (
    <div className="bg-[#F8F6F0] min-h-screen pb-16">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-[#E8E4DA] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-[#537379] overflow-x-auto no-scrollbar">
            <Link href="/" className="hover:text-[#0E3B43] transition-colors whitespace-nowrap">
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/buscar?tipo=places" className="hover:text-[#0E3B43] transition-colors whitespace-nowrap">
              Guia de Locais
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link
              href={`/buscar?tipo=places&grupo=${place.category_group}`}
              className="hover:text-[#0E3B43] transition-colors whitespace-nowrap font-medium"
            >
              {meta.label}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[#0E3B43] font-bold truncate max-w-[200px]">
              {place.name}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0E3B43] bg-[#F8F6F0] hover:bg-[#E8E4DA] transition-all border border-[#E8E4DA]"
            title="Compartilhar este local"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Civic Place Hero Header */}
      <header className="relative bg-[#0E3B43] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {place.cover_url && (
          <div className="absolute inset-0 z-0 opacity-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={place.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E3B43] via-[#0E3B43]/90 to-transparent z-0" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-3xl">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${meta.bg}`}>
                <CategoryIcon className="w-3.5 h-3.5" />
                {place.subcategory || meta.label}
              </span>

              {place.verification_status === 'verified' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#0E3B43] shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4FA6A6]" />
                  Informação Oficial Verificada
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#154E58] text-teal-200 border border-teal-300/30">
                <Compass className="w-3.5 h-3.5" />
                Ponto de Referência Regional
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              {place.name}
            </h1>

            {/* Address */}
            <div className="flex items-center gap-2 text-sm text-stone-200">
              <MapPin className="w-4 h-4 text-[#E36845] shrink-0" />
              <span>
                {place.address}{place.number ? `, ${place.number}` : ''}
                {place.complement ? ` - ${place.complement}` : ''}
                {place.neighborhood?.name ? ` • ${place.neighborhood.name}` : ''}
                {place.postal_code ? ` • CEP ${place.postal_code}` : ''}
              </span>
            </div>

            {/* Hours */}
            {place.opening_hours && (
              <div className="flex items-center gap-2 text-xs text-teal-200 font-medium">
                <Clock className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span>Atendimento: {place.opening_hours}</span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={mapsDirectionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-bold shadow-lg transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4 text-white" />
              <span>Como Chegar (GPS)</span>
            </a>

            {place.phone && (
              <a
                href={`tel:${place.phone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-all"
              >
                <Phone className="w-4 h-4 text-teal-300" />
                <span>Ligar</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Col (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Details Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-4">
              <h2 className="text-lg font-black text-[#0E3B43]">Sobre este Local</h2>
              <p className="text-sm text-[#537379] leading-relaxed whitespace-pre-line">
                {place.description || place.short_description || 'Local de utilidade pública e convivência comunitária da região.'}
              </p>

              {/* Tags */}
              {place.tags && place.tags.length > 0 && (
                <div className="pt-3 border-t border-[#E8E4DA] flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#537379]">Tags:</span>
                  {place.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F8F6F0] text-[#0E3B43] border border-[#E8E4DA]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Source & Transparency Notice */}
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] flex items-start gap-3 text-xs text-[#537379]">
                <Info className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#0E3B43]">Fonte das Informações</p>
                  <p>
                    Dados obtidos de fontes públicas oficiais ({place.source_name || place.source || 'Prefeitura / Governo / Cartografia Aberta'}).
                    Este local não possui plano comercial na plataforma e atua como serviço à comunidade.
                  </p>
                  {place.source_url && (
                    <a
                      href={place.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#0D9488] hover:underline font-bold mt-1"
                    >
                      <span>Ver portal oficial da fonte</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Map of Location and Surrounding Area */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#0E3B43]">Localização no Mapa</h2>
                  <p className="text-xs text-[#537379]">
                    Veja onde fica o local e comércios no raio próximo
                  </p>
                </div>
                <a
                  href={mapsDirectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#E36845] hover:underline flex items-center gap-1"
                >
                  <span>Abrir no Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <LeafletMap
                places={[place]}
                businesses={nearbyBusinesses.map((n) => n.business)}
                center={[place.latitude, place.longitude]}
                selectedPlaceId={place.id}
                zoom={15}
                radiusKm={1}
                height="380px"
              />
            </div>
          </div>

          {/* Sidebar Info (1/3) */}
          <aside className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow space-y-5">
              <h3 className="font-black text-base text-[#0E3B43] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4FA6A6]" />
                <span>Dados de Contato & Utilidade</span>
              </h3>

              <div className="space-y-3.5 text-xs text-[#0E3B43]">
                {place.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                    <div>
                      <span className="block font-bold text-[#537379] text-[10px] uppercase">Telefone</span>
                      <a href={`tel:${place.phone.replace(/\D/g, '')}`} className="hover:text-[#E36845] font-semibold">
                        {place.phone}
                      </a>
                    </div>
                  </div>
                )}

                {place.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                    <div>
                      <span className="block font-bold text-[#537379] text-[10px] uppercase">E-mail</span>
                      <a href={`mailto:${place.email}`} className="hover:text-[#E36845] font-semibold truncate max-w-[200px] block">
                        {place.email}
                      </a>
                    </div>
                  </div>
                )}

                {place.website && (
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                    <div>
                      <span className="block font-bold text-[#537379] text-[10px] uppercase">Site / Portal Oficial</span>
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#E36845] font-semibold truncate max-w-[200px] block"
                      >
                        {place.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 pt-2 border-t border-[#E8E4DA]">
                  <MapPin className="w-4 h-4 text-[#E36845] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-[#537379] text-[10px] uppercase">Endereço Completo</span>
                    <p className="font-semibold text-[#0E3B43] leading-relaxed">
                      {place.address}{place.number ? `, ${place.number}` : ''}
                      {place.complement ? ` (${place.complement})` : ''}
                      <br />
                      {place.neighborhood?.name || place.neighborhood_name || 'Bairro'} - {place.city?.name || place.city_name || 'São Paulo'} / {place.state_id || 'SP'}
                      <br />
                      CEP: {place.postal_code || 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E4DA]">
                <a
                  href={mapsDirectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5 text-teal-300" />
                  <span>Traçar Rota no GPS</span>
                </a>
              </div>
            </div>
          </aside>
        </div>

        {/* PROXIMITY ANCHOR SECTION: Comércios e Serviços no Entorno */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4DA] pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#E36845]/15 text-[#E36845] mb-2">
                <Store className="w-3.5 h-3.5" />
                <span>Descoberta por Proximidade</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight">
                Comércios e Serviços Próximos a {place.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#537379] mt-0.5">
                Aproveite sua ida a este local para conhecer e apoiar os negócios e profissionais do entorno
              </p>
            </div>

            <Link
              href={`/buscar?q=${encodeURIComponent(place.neighborhood?.name || place.neighborhood_name || '')}`}
              className="text-xs font-bold text-[#E36845] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Ver todos os negócios da região →</span>
            </Link>
          </div>

          {nearbyBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyBusinesses.map(({ business: biz, distanceKm }) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  userDistance={distanceKm}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-[#F8F6F0] rounded-2xl border border-dashed border-[#E8E4DA] p-6 space-y-3">
              <Store className="w-10 h-10 text-[#537379] mx-auto opacity-50" />
              <h3 className="font-black text-sm text-[#0E3B43]">
                Nenhum comércio cadastrado a menos de 3 km deste local ainda
              </h3>
              <p className="text-xs text-[#537379] max-w-md mx-auto">
                Você tem uma loja ou presta serviços próximo a {place.name}? Cadastre seu negócio na Vitriniza e seja encontrado por quem visita este ponto!
              </p>
              <Link
                href="/para-empresas"
                className="inline-block px-5 py-2.5 rounded-full bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold transition-all shadow-sm"
              >
                Cadastrar meu negócio no entorno
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
