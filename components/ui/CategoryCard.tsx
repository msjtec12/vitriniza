'use client';

import React from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
  Dog,
  Wrench,
  Cake,
  Home,
  Car,
  Gift,
  Shirt,
  Smartphone,
  HeartPulse,
  Building2,
  ShieldPlus,
  Briefcase,
  Store,
  Search,
} from 'lucide-react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

// Color & icon metadata for vibrant, instantly recognizable categories
interface CategoryVisual {
  icon: React.ElementType;
  bgGradient: string;
  iconColor: string;
  badgeBorder: string;
}

const categoryVisuals: Record<string, CategoryVisual> = {
  alimentacao: {
    icon: UtensilsCrossed,
    bgGradient: 'from-orange-500/20 via-amber-500/10 to-orange-500/5',
    iconColor: 'text-[#E36845]',
    badgeBorder: 'border-orange-500/30',
  },
  'imoveis-corretores': {
    icon: Building2,
    bgGradient: 'from-emerald-600/20 via-teal-700/10 to-emerald-600/5',
    iconColor: 'text-emerald-700',
    badgeBorder: 'border-emerald-600/30',
  },
  'planos-saude-seguros': {
    icon: ShieldPlus,
    bgGradient: 'from-blue-600/20 via-cyan-600/10 to-blue-600/5',
    iconColor: 'text-blue-700',
    badgeBorder: 'border-blue-600/30',
  },
  'servicos-reformas': {
    icon: Wrench,
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-amber-500/5',
    iconColor: 'text-amber-600',
    badgeBorder: 'border-amber-500/30',
  },
  'servicos-domesticos': {
    icon: Sparkles,
    bgGradient: 'from-teal-500/20 via-sky-500/10 to-teal-500/5',
    iconColor: 'text-teal-600',
    badgeBorder: 'border-teal-500/30',
  },
  'beleza-estetica': {
    icon: Sparkles,
    bgGradient: 'from-pink-500/20 via-rose-500/10 to-pink-500/5',
    iconColor: 'text-pink-600',
    badgeBorder: 'border-pink-500/30',
  },
  'lojas-comercio': {
    icon: ShoppingBag,
    bgGradient: 'from-blue-500/20 via-sky-500/10 to-blue-500/5',
    iconColor: 'text-blue-600',
    badgeBorder: 'border-blue-500/30',
  },
  'pet-shop': {
    icon: Dog,
    bgGradient: 'from-emerald-500/20 via-teal-500/10 to-emerald-500/5',
    iconColor: 'text-emerald-600',
    badgeBorder: 'border-emerald-500/30',
  },
  'festas-doces': {
    icon: Cake,
    bgGradient: 'from-purple-500/20 via-fuchsia-500/10 to-purple-500/5',
    iconColor: 'text-purple-600',
    badgeBorder: 'border-purple-500/30',
  },
  'casa-construcao': {
    icon: Home,
    bgGradient: 'from-stone-500/20 via-amber-700/10 to-stone-500/5',
    iconColor: 'text-[#0E3B43]',
    badgeBorder: 'border-stone-500/30',
  },
  automotivo: {
    icon: Car,
    bgGradient: 'from-red-500/20 via-rose-500/10 to-red-500/5',
    iconColor: 'text-red-600',
    badgeBorder: 'border-red-500/30',
  },
  'artesanato-presentes': {
    icon: Gift,
    bgGradient: 'from-amber-600/20 via-orange-500/10 to-amber-600/5',
    iconColor: 'text-[#E36845]',
    badgeBorder: 'border-amber-600/30',
  },
  'moda-vestuario': {
    icon: Shirt,
    bgGradient: 'from-violet-500/20 via-purple-500/10 to-violet-500/5',
    iconColor: 'text-violet-600',
    badgeBorder: 'border-violet-500/30',
  },
  'servicos-profissionais': {
    icon: Briefcase,
    bgGradient: 'from-indigo-600/20 via-slate-600/10 to-indigo-600/5',
    iconColor: 'text-indigo-700',
    badgeBorder: 'border-indigo-600/30',
  },
  'tecnologia-celulares': {
    icon: Smartphone,
    bgGradient: 'from-cyan-500/20 via-blue-500/10 to-cyan-500/5',
    iconColor: 'text-[#4FA6A6]',
    badgeBorder: 'border-cyan-500/30',
  },
  'saude-bem-estar': {
    icon: HeartPulse,
    bgGradient: 'from-teal-500/20 via-emerald-500/10 to-teal-500/5',
    iconColor: 'text-teal-600',
    badgeBorder: 'border-teal-500/30',
  },
  'investigacao-detetive': {
    icon: Search,
    bgGradient: 'from-slate-700/20 via-zinc-800/10 to-slate-700/5',
    iconColor: 'text-[#0E3B43]',
    badgeBorder: 'border-slate-700/30',
  },
};

const defaultVisual: CategoryVisual = {
  icon: Store,
  bgGradient: 'from-[#4FA6A6]/20 via-[#4FA6A6]/10 to-transparent',
  iconColor: 'text-[#0E3B43]',
  badgeBorder: 'border-[#4FA6A6]/30',
};

interface CategoryCardProps {
  category: Category;
  variant?: 'pill' | 'grid' | 'carousel' | 'compact';
  isSelected?: boolean;
  onClick?: () => void;
  count?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  variant = 'grid',
  isSelected = false,
  onClick,
  count,
}) => {
  const visual = categoryVisuals[category.slug] || defaultVisual;
  const IconComponent = visual.icon;

  if (variant === 'pill') {
    return (
      <button
        onClick={onClick}
        type="button"
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap border shrink-0',
          isSelected
            ? 'bg-[#E36845] text-white border-[#E36845] shadow-xs'
            : 'bg-white text-[#0E3B43] border-[#4FA6A6]/25 hover:border-[#E36845] hover:bg-[#F8F6F0]'
        )}
      >
        <div className={cn('p-1 rounded-full bg-stone-100', isSelected && 'bg-white/20')}>
          <IconComponent className={cn('w-3.5 h-3.5', isSelected ? 'text-white' : visual.iconColor)} />
        </div>
        <span>{category.name}</span>
        {count !== undefined && (
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-bold',
              isSelected ? 'bg-white/20 text-white' : 'bg-[#4FA6A6]/15 text-[#0E3B43]'
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'carousel') {
    return (
      <Link
        href={`/buscar?categoria=${category.slug}`}
        className="group flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow card-shadow-hover transition-all hover:border-[#E36845]/50 w-36 sm:w-44 shrink-0 snap-start select-none"
      >
        {/* Dynamic Colorful Icon Container */}
        <div
          className={cn(
            'w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:scale-110 shadow-xs border',
            visual.bgGradient,
            visual.badgeBorder
          )}
        >
          <IconComponent className={cn('w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110', visual.iconColor)} />
        </div>
        <span className="text-xs sm:text-sm font-black text-[#0E3B43] group-hover:text-[#E36845] line-clamp-1 transition-colors">
          {category.name}
        </span>
        {category.description && (
          <span className="text-[11px] text-[#537379] line-clamp-1 mt-0.5 font-medium">
            {category.description}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/buscar?categoria=${category.slug}`}
      className="group flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow card-shadow-hover transition-all hover:border-[#E36845]/50"
    >
      <div
        className={cn(
          'w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:scale-110 shadow-xs border',
          visual.bgGradient,
          visual.badgeBorder
        )}
      >
        <IconComponent className={cn('w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110', visual.iconColor)} />
      </div>
      <span className="text-xs sm:text-sm font-black text-[#0E3B43] group-hover:text-[#E36845] line-clamp-1 transition-colors">
        {category.name}
      </span>
      {category.description && (
        <span className="text-[11px] text-[#537379] line-clamp-1 mt-0.5 font-medium hidden sm:block">
          {category.description}
        </span>
      )}
    </Link>
  );
};
