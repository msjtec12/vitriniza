'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Search, ChevronRight, Store } from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business } from '@/types';
import { BusinessCard } from '@/components/ui/BusinessCard';

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = () => {
    try {
      const favIds: string[] = JSON.parse(localStorage.getItem('vitriniza_favorites') || '[]');
      const all = store.getBusinesses();
      const filtered = all.filter((b) => favIds.includes(b.id));
      setFavorites(filtered);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#F8F6F0]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#537379]">
        <Link href="/" className="hover:text-[#E36845] transition-colors">Início</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-bold text-[#0E3B43]">Meus Favoritos</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-[#E36845] fill-current" />
            <span>Comércios Favoritados</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#537379] mt-1">
            Seus estabelecimentos favoritos salvos para acesso rápido
          </p>
        </div>

        {favorites.length > 0 && (
          <span className="px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-xs font-bold text-[#0E3B43]">
            {favorites.length} salvos
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#537379]">Carregando favoritos...</div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              onFavoriteToggle={() => loadFavorites()}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#E8E4DA] p-8 space-y-3">
          <Heart className="w-12 h-12 text-[#537379] mx-auto opacity-30" />
          <h3 className="text-base font-black text-[#0E3B43]">Você ainda não favoritou nenhum comércio.</h3>
          <p className="text-xs text-[#537379] max-w-sm mx-auto leading-relaxed">
            Clique no ícone de coração nos cards dos estabelecimentos para guardar seus restaurantes, salões e oficinas favoritos aqui.
          </p>
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Explorar Comércios</span>
          </Link>
        </div>
      )}
    </div>
  );
}
