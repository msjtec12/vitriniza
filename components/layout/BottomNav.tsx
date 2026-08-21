'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Flame, Heart, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const items = [
    { label: 'Início', href: '/', icon: Home },
    { label: 'Explorar', href: '/buscar', icon: Search },
    { label: 'Ofertas', href: '/buscar?promocoes=true', icon: Flame },
    { label: 'Favoritos', href: '/favoritos', icon: Heart },
    { label: 'Empresas', href: '/para-empresas', icon: Building2 },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8F6F0]/95 backdrop-blur-lg border-t border-[#E8E4DA] px-2 py-1.5 shadow-xl pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href.split('?')[0]);

          const IconComponent = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200',
                isActive
                  ? 'bg-[#E36845]/15 text-[#E36845]'
                  : 'text-[#0E3B43]/75 hover:text-[#0E3B43]'
              )}
            >
              <div className="relative">
                <IconComponent className={cn('w-5 h-5 transition-transform', isActive ? 'scale-110 text-[#E36845] stroke-[2.5]' : 'stroke-[1.75]')} />
                {item.label === 'Ofertas' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E36845] animate-pulse" />
                )}
              </div>
              <span className={cn('text-[10px] mt-0.5 tracking-tight', isActive ? 'font-black text-[#E36845]' : 'font-semibold text-[#537379]')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
