'use client';

import React from 'react';
import Link from 'next/link';
import {
  Utensils,
  Scissors,
  ShoppingBag,
  Dog,
  Wrench,
  Cake,
  Home,
  Car,
  Gift,
  Shirt,
  Laptop,
  Dumbbell,
  Store,
} from 'lucide-react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Scissors,
  ShoppingBag,
  Dog,
  Wrench,
  Cake,
  Home,
  Car,
  Gift,
  Shirt,
  Laptop,
  Dumbbell,
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
  const IconComponent = iconMap[category.icon] || Store;

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
        <IconComponent className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-[#E36845]')} />
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
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F8F6F0] text-[#0E3B43] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 group-hover:bg-[#E36845] group-hover:text-white border border-[#E8E4DA]">
          <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <span className="text-xs sm:text-sm font-black text-[#0E3B43] group-hover:text-[#E36845] line-clamp-1 transition-colors">
          {category.name}
        </span>
        {category.description && (
          <span className="text-[11px] text-[#537379] line-clamp-1 mt-0.5">
            {category.description}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/buscar?categoria=${category.slug}`}
      className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow card-shadow-hover transition-all hover:border-[#E36845]/50"
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F8F6F0] text-[#0E3B43] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 group-hover:bg-[#E36845] group-hover:text-white border border-[#E8E4DA]">
        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <span className="text-xs sm:text-sm font-black text-[#0E3B43] group-hover:text-[#E36845] line-clamp-1 transition-colors">
        {category.name}
      </span>
      {category.description && (
        <span className="text-[11px] text-[#537379] line-clamp-1 mt-0.5 hidden sm:block">
          {category.description}
        </span>
      )}
    </Link>
  );
};
