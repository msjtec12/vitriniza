'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { store } from '@/lib/data/store';
import { Article, LocalEvent } from '@/types';
import { formatDate } from '@/lib/utils';

export default function DescobrirPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);

  useEffect(() => {
    setArticles(store.getArticles());
    setEvents(store.getEvents());
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 bg-[#F8F6F0]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#537379]">
        <Link href="/" className="hover:text-[#E36845] transition-colors">Início</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-[#0E3B43]">Descobrir & Histórias</span>
      </div>

      {/* Hero Header */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-white to-[#F8F6F0] border border-[#4FA6A6]/20 card-shadow">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-xs font-bold text-[#0E3B43] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#E36845]" />
          <span>Voz da Comunidade Local</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0E3B43] tracking-tight mb-3">
          Descubra quem faz o bairro acontecer
        </h1>
        <p className="text-xs sm:text-sm text-[#537379] max-w-2xl leading-relaxed">
          Histórias inspiradoras de empreendedores, tradições familiares, novos projetos comunitários e guias culturais sobre o comércio de São Paulo.
        </p>
      </div>

      {/* Articles Grid */}
      <section className="space-y-6">
        <h2 className="text-xl font-black text-[#0E3B43] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#E36845]" />
          <span>Artigos & Reportagens Locais</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art) => (
            <Link
              key={art.id}
              href={`/descobrir/${art.slug}`}
              className="group flex flex-col bg-white rounded-3xl border border-[#4FA6A6]/20 overflow-hidden card-shadow card-shadow-hover transition-all"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={art.cover_image}
                  alt={art.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#0E3B43] shadow-xs">
                    {art.category}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-white">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#0E3B43] group-hover:text-[#E36845] transition-colors line-clamp-2 mb-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#537379] line-clamp-3 mb-4 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-[#537379] pt-3 border-t border-[#E8E4DA]">
                  <span className="font-semibold">{art.neighborhood_name}</span>
                  <span className="font-bold text-[#0E3B43] group-hover:text-[#E36845] transition-colors">Ler artigo →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Events Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-black text-[#0E3B43] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#E36845]" />
          <span>Agenda & Eventos do Bairro</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="flex flex-col sm:flex-row bg-white rounded-3xl border border-[#4FA6A6]/20 overflow-hidden card-shadow p-5 gap-4"
            >
              <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={evt.image_url} alt={evt.title} className="w-full h-full object-cover" />
              </div>

              <div className="flex flex-col justify-between flex-1">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#4FA6A6]/15 text-[#0E3B43] text-[11px] font-bold mb-2">
                    <Calendar className="w-3 h-3 text-[#E36845]" />
                    {formatDate(evt.event_date)} • {evt.event_time}
                  </span>
                  <h3 className="font-black text-base text-[#0E3B43] mb-1 leading-snug">{evt.title}</h3>
                  <p className="text-xs text-[#537379] line-clamp-2 leading-relaxed mb-2">{evt.description}</p>
                </div>

                <div className="text-xs text-[#0E3B43] font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#E36845]" />
                  <span>{evt.location_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
