'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Calendar, User, MapPin, ArrowLeft, Share2 } from 'lucide-react';
import { store } from '@/lib/data/store';
import { Article } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (slug) {
      const art = store.getArticleBySlug(slug);
      if (art) setArticle(art);
    }
  }, [slug]);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[#6E7771]">
        Carregando matéria...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#6E7771]">
        <Link href="/" className="hover:text-[#E85D2A]">Início</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/descobrir" className="hover:text-[#E85D2A]">Descobrir</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-[#1C1C1C] truncate">{article.title}</span>
      </div>

      {/* Article Header */}
      <div className="space-y-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FDECE5] text-[#E85D2A]">
          {article.category}
        </span>

        <h1 className="text-2xl sm:text-4xl font-black text-[#1C1C1C] leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-[#6E7771] pt-2 border-y border-[#F0E5DE] py-3">
          <div className="flex items-center gap-1.5 font-bold text-[#1C1C1C]">
            <User className="w-3.5 h-3.5 text-[#E85D2A]" />
            <span>{article.author_name}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(article.created_at)}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 text-[#194D3A] font-semibold">
            <MapPin className="w-3.5 h-3.5 text-[#E85D2A]" />
            <span>{article.neighborhood_name}</span>
          </div>
        </div>
      </div>

      {/* Featured Cover Image */}
      <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
      </div>

      {/* Article Body */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E5DE] card-shadow space-y-4 text-sm sm:text-base text-[#2D312E] leading-relaxed whitespace-pre-line">
        {article.content}
      </div>

      {/* Back button */}
      <div className="pt-4 flex justify-between items-center">
        <Link
          href="/descobrir"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#F0E5DE] text-xs font-bold text-[#1C1C1C] hover:bg-stone-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para matérias</span>
        </Link>
      </div>
    </div>
  );
}
