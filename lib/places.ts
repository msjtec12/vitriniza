import React from 'react';
import {
  HeartPulse,
  GraduationCap,
  Trees,
  Train,
  Landmark,
  Church,
  Palette,
  Building2,
} from 'lucide-react';
import { PlaceCategoryGroup } from '@/types';

export interface PlaceCategoryMetaInfo {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  text: string;
  pinColor: string;
}

export const PLACE_CATEGORY_META: Record<PlaceCategoryGroup, PlaceCategoryMetaInfo> = {
  saude: {
    label: 'Saúde & UBS',
    icon: HeartPulse,
    color: '#E11D48',
    bg: 'bg-rose-50 border-rose-200 text-rose-700',
    text: 'text-rose-700',
    pinColor: '#E11D48',
  },
  educacao: {
    label: 'Educação',
    icon: GraduationCap,
    color: '#2563EB',
    bg: 'bg-blue-50 border-blue-200 text-blue-700',
    text: 'text-blue-700',
    pinColor: '#2563EB',
  },
  lazer: {
    label: 'Lazer & Parques',
    icon: Trees,
    color: '#059669',
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    text: 'text-emerald-700',
    pinColor: '#059669',
  },
  transporte: {
    label: 'Transporte & Estações',
    icon: Train,
    color: '#7C3AED',
    bg: 'bg-purple-50 border-purple-200 text-purple-700',
    text: 'text-purple-700',
    pinColor: '#7C3AED',
  },
  servicos_publicos: {
    label: 'Serviços Públicos',
    icon: Landmark,
    color: '#0D9488',
    bg: 'bg-teal-50 border-teal-200 text-teal-700',
    text: 'text-teal-700',
    pinColor: '#0D9488',
  },
  religiao: {
    label: 'Igrejas & Fé',
    icon: Church,
    color: '#D97706',
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    text: 'text-amber-700',
    pinColor: '#D97706',
  },
  cultura: {
    label: 'Cultura & Artes',
    icon: Palette,
    color: '#DB2777',
    bg: 'bg-pink-50 border-pink-200 text-pink-700',
    text: 'text-pink-700',
    pinColor: '#DB2777',
  },
  outros: {
    label: 'Utilidade Pública',
    icon: Building2,
    color: '#475569',
    bg: 'bg-slate-50 border-slate-200 text-slate-700',
    text: 'text-slate-700',
    pinColor: '#475569',
  },
};

export function getPlaceCategoryMeta(group?: string): PlaceCategoryMetaInfo {
  if (!group) return PLACE_CATEGORY_META.outros;
  return (PLACE_CATEGORY_META as Record<string, PlaceCategoryMetaInfo>)[group] || PLACE_CATEGORY_META.outros;
}

export function getPlaceSchemaType(group?: PlaceCategoryGroup): string {
  switch (group) {
    case 'saude':
      return 'Hospital';
    case 'lazer':
      return 'Park';
    case 'educacao':
      return 'EducationalOrganization';
    case 'transporte':
      return 'BusStation';
    case 'servicos_publicos':
      return 'GovernmentBuilding';
    case 'religiao':
      return 'PlaceOfWorship';
    default:
      return 'CivicStructure';
  }
}
