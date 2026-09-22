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
import type { Place, PlaceCategoryGroup } from '@/types';

export interface PlaceCategoryMetaInfo {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  text: string;
  pinColor: string;
  defaultImage: string;
  defaultImageAlt: string;
}

export const PLACE_CATEGORY_META: Record<PlaceCategoryGroup, PlaceCategoryMetaInfo> = {
  saude: {
    label: 'Saúde & UBS',
    icon: HeartPulse,
    color: '#E11D48',
    bg: 'bg-rose-50 border-rose-200 text-rose-700',
    text: 'text-rose-700',
    pinColor: '#E11D48',
    defaultImage: '/images/places/default-saude.svg',
    defaultImageAlt: 'Ilustração de uma unidade de saúde',
  },
  educacao: {
    label: 'Educação',
    icon: GraduationCap,
    color: '#2563EB',
    bg: 'bg-blue-50 border-blue-200 text-blue-700',
    text: 'text-blue-700',
    pinColor: '#2563EB',
    defaultImage: '/images/places/default-educacao.svg',
    defaultImageAlt: 'Ilustração de educação e escola',
  },
  lazer: {
    label: 'Lazer & Parques',
    icon: Trees,
    color: '#059669',
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    text: 'text-emerald-700',
    pinColor: '#059669',
    defaultImage: '/images/places/default-lazer.svg',
    defaultImageAlt: 'Ilustração de parque e área de lazer',
  },
  transporte: {
    label: 'Transporte & Estações',
    icon: Train,
    color: '#7C3AED',
    bg: 'bg-purple-50 border-purple-200 text-purple-700',
    text: 'text-purple-700',
    pinColor: '#7C3AED',
    defaultImage: '/images/places/default-transporte.svg',
    defaultImageAlt: 'Ilustração de transporte público',
  },
  servicos_publicos: {
    label: 'Serviços Públicos',
    icon: Landmark,
    color: '#0D9488',
    bg: 'bg-teal-50 border-teal-200 text-teal-700',
    text: 'text-teal-700',
    pinColor: '#0D9488',
    defaultImage: '/images/places/default-servicos-publicos.svg',
    defaultImageAlt: 'Ilustração de um prédio de serviço público',
  },
  religiao: {
    label: 'Igrejas & Fé',
    icon: Church,
    color: '#D97706',
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    text: 'text-amber-700',
    pinColor: '#D97706',
    defaultImage: '/images/places/default-religiao.svg',
    defaultImageAlt: 'Ilustração de um local religioso',
  },
  cultura: {
    label: 'Cultura & Artes',
    icon: Palette,
    color: '#DB2777',
    bg: 'bg-pink-50 border-pink-200 text-pink-700',
    text: 'text-pink-700',
    pinColor: '#DB2777',
    defaultImage: '/images/places/default-cultura.svg',
    defaultImageAlt: 'Ilustração de cultura e artes',
  },
  turismo: {
    label: 'Turismo & Cartões Postais',
    icon: Landmark,
    color: '#EA580C',
    bg: 'bg-orange-50 border-orange-200 text-orange-700',
    text: 'text-orange-700',
    pinColor: '#EA580C',
    defaultImage: '/images/places/default-turismo.svg',
    defaultImageAlt: 'Ilustração de turismo e ponto de interesse',
  },
  esporte: {
    label: 'Esporte & Atividades Físicas',
    icon: Trees,
    color: '#0284C7',
    bg: 'bg-sky-50 border-sky-200 text-sky-700',
    text: 'text-sky-700',
    pinColor: '#0284C7',
    defaultImage: '/images/places/default-esporte.svg',
    defaultImageAlt: 'Ilustração de esporte e atividade física',
  },
  outros: {
    label: 'Utilidade Pública',
    icon: Building2,
    color: '#475569',
    bg: 'bg-slate-50 border-slate-200 text-slate-700',
    text: 'text-slate-700',
    pinColor: '#475569',
    defaultImage: '/images/places/default-outros.svg',
    defaultImageAlt: 'Ilustração de utilidade pública',
  },
};

export function getPlaceCategoryMeta(group?: string): PlaceCategoryMetaInfo {
  if (!group) return PLACE_CATEGORY_META.outros;
  return (PLACE_CATEGORY_META as Record<string, PlaceCategoryMetaInfo>)[group] || PLACE_CATEGORY_META.outros;
}

export function getPlaceImage(place: Pick<Place, 'category_group' | 'photo_url' | 'cover_url' | 'image_url'>) {
  const meta = getPlaceCategoryMeta(place.category_group);
  const customImage = place.photo_url || place.cover_url || place.image_url;

  return {
    src: customImage || meta.defaultImage,
    alt: customImage ? undefined : meta.defaultImageAlt,
    isDefault: !customImage,
  };
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
