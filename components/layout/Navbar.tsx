'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  Heart,
  Store,
  Compass,
  Flame,
  Search,
  Building2,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { store } from '@/lib/data/store';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [favCount, setFavCount] = useState(0);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Guaianases');
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);

  const neighborhoods = store.getNeighborhoods();

  useEffect(() => {
    const updateFavs = () => {
      try {
        const favs = JSON.parse(localStorage.getItem('vitriniza_favorites') || '[]');
        setFavCount(favs.length);
      } catch {
        setFavCount(0);
      }
    };
    updateFavs();
    window.addEventListener('storage', updateFavs);
    return () => window.removeEventListener('storage', updateFavs);
  }, []);

  const navLinks = [
    { label: 'Início', href: '/', icon: Store },
    { label: 'Explorar', href: '/buscar', icon: Search },
    { label: 'Ofertas 🔥', href: '/buscar?promocoes=true', icon: Flame },
    { label: 'Descobrir', href: '/descobrir', icon: Compass },
    { label: 'Para Empresas', href: '/para-empresas', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-[#E8E4DA] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-4">
        {/* Brand Logo & Region Selector */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center group py-1">
            {/* Real Logo image with transparent blending */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Vitriniza - O comércio perto de você"
              className="h-14 sm:h-18 md:h-20 w-auto max-w-[190px] sm:max-w-[260px] object-contain transition-transform group-hover:scale-105 mix-blend-multiply contrast-105"
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>

          {/* Region Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsRegionMenuOpen(!isRegionMenuOpen)}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#4FA6A6]/40 text-xs font-bold text-[#0E3B43] transition-all shadow-2xs cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E36845]" />
              <span>{selectedNeighborhood} - SP</span>
              <ChevronDown className="w-3 h-3 text-[#537379]" />
            </button>

            {isRegionMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-[#E8E4DA] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <span className="block px-3 py-1 text-[10px] font-bold text-[#537379] uppercase">
                  Selecione sua Região
                </span>
                {neighborhoods.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setSelectedNeighborhood(n.name);
                      setIsRegionMenuOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer',
                      selectedNeighborhood === n.name
                        ? 'bg-[#E36845] text-white font-bold'
                        : 'text-[#0E3B43] hover:bg-[#F8F6F0]'
                    )}
                  >
                    <span>{n.name}</span>
                    <span className="text-[10px] opacity-75">São Paulo</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5',
                  isActive
                    ? 'bg-[#E36845]/10 text-[#E36845] font-bold'
                    : 'text-[#0E3B43] hover:text-[#E36845] hover:bg-white/60'
                )}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Favorites */}
          <Link
            href="/favoritos"
            title="Meus Favoritos"
            className="relative p-2.5 rounded-full bg-white hover:bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] hover:text-[#E36845] transition-all shadow-2xs"
          >
            <Heart className="w-4 h-4" />
            {favCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E36845] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {favCount}
              </span>
            )}
          </Link>

          {/* Discreet Merchant Access Link */}
          <Link
            href="/painel"
            title="Área restrita do lojista"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F6F0] border border-[#4FA6A6]/30 text-[#0E3B43] text-xs font-bold shadow-2xs transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#E36845]" />
            <span className="hidden sm:inline">Área do Lojista</span>
            <span className="sm:hidden">Entrar</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
