import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { store } from '@/lib/data/store';
import { BusinessShowcaseClient } from '@/components/business/BusinessShowcaseClient';
import { getApprovedReviews, getPublicBusinessBySlug } from '@/lib/data/server';
import { SITE_URL } from '@/lib/site';
import { serializeJsonLd } from '@/lib/security/json-ld.mjs';

interface PageProps {
  params: Promise<{
    state: string;
    city: string;
    neighborhood: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const business =
    (await getPublicBusinessBySlug(resolvedParams.slug)) ||
    store.getBusinessBySlug(resolvedParams.slug);

  if (!business) {
    const formattedName = resolvedParams.slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `${formattedName} | Vitriniza`,
      description: `Conheça os produtos, serviços e ofertas de ${formattedName} na Vitriniza.`,
    };
  }

  const formatSlugName = (slug: string) => {
    if (!slug) return '';
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const neighborhoodName = business.neighborhood?.name || formatSlugName(resolvedParams.neighborhood) || 'Bairro';
  const cityName = business.city?.name || formatSlugName(resolvedParams.city) || 'Cidade';
  const stateUf = (business.state_id || resolvedParams.state || 'sp').toLowerCase();
  const pageUrl = `${SITE_URL}/${stateUf}/${business.city?.slug || resolvedParams.city || 'cidade'}/${business.neighborhood?.slug || resolvedParams.neighborhood || 'bairro'}/${business.slug}`;

  // Helper para garantir URL absoluta para crawlers de redes sociais (WhatsApp, Facebook, etc.)
  const toAbsoluteUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string') return `${SITE_URL}/logo.png`;
    const trimmed = url.trim();
    if (!trimmed) return `${SITE_URL}/logo.png`;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    return `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  };

  // Priorização da foto do estabelecimento:
  // 1. Logo personalizado (se não for o padrão /logo.png)
  // 2. Foto de capa personalizada (se não for o placeholder genérico)
  // 3. Qualquer foto de capa informada
  // 4. Foto do primeiro produto cadastrado
  // 5. Logo padrão do Vitriniza
  const genericCover = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5';
  const hasCustomLogo = Boolean(business.logo_url && !business.logo_url.includes('/logo.png') && business.logo_url.length > 5);
  const hasCustomCover = Boolean(business.cover_url && !business.cover_url.includes(genericCover) && business.cover_url.length > 5);
  const firstProductImage = business.products?.find((p) => p.image_url && p.image_url.length > 5)?.image_url;

  const rawImage = hasCustomCover
    ? business.cover_url
    : hasCustomLogo
    ? business.logo_url
    : business.cover_url || firstProductImage || business.logo_url;

  const shareImage = toAbsoluteUrl(rawImage);

  // Descrição do próprio estabelecimento:
  // Prioriza o slogan/bio cadastrado ou descrição completa da loja
  const customBio = business.short_description?.trim() || business.description?.trim();
  const pageDescription = customBio
    ? customBio
    : `${business.name}: ${business.category?.name || 'Comércio Local'} em ${neighborhoodName}, ${cityName}. Veja catálogo, ofertas, horários e atendimento direto via WhatsApp.`;

  const pageTitle = business.short_description?.trim()
    ? `${business.name} - ${business.short_description.trim()}`
    : `${business.name} | ${neighborhoodName}, ${cityName}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      business.name,
      neighborhoodName,
      cityName,
      business.category?.name || 'comércio local',
      'WhatsApp comércio',
    ],
    openGraph: {
      title: business.name,
      description: pageDescription,
      url: pageUrl,
      siteName: business.name,
      locale: 'pt_BR',
      type: 'website',
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: `${business.name} - ${neighborhoodName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: business.name,
      description: pageDescription,
      images: [shareImage],
    },
  };
}

export default async function BusinessShowcasePage({ params }: PageProps) {
  const resolvedParams = await params;
  const business =
    (await getPublicBusinessBySlug(resolvedParams.slug)) ||
    store.getBusinessBySlug(resolvedParams.slug);

  if (business) {
    const canonicalState = (business.state_id || resolvedParams.state).toLowerCase();
    const canonicalCity = business.city?.slug || resolvedParams.city.toLowerCase();
    const canonicalNeighborhood = business.neighborhood?.slug || resolvedParams.neighborhood.toLowerCase();
    if (
      resolvedParams.state.toLowerCase() !== canonicalState ||
      resolvedParams.city.toLowerCase() !== canonicalCity ||
      resolvedParams.neighborhood.toLowerCase() !== canonicalNeighborhood
    ) {
      notFound();
    }
  }

  const reviews = business
    ? await getApprovedReviews(business.id)
    : [];

  const formatSlugName = (slug: string) => {
    if (!slug) return '';
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const neighborhoodName = business?.neighborhood?.name || formatSlugName(resolvedParams.neighborhood) || 'Bairro';
  const cityName = business?.city?.name || formatSlugName(resolvedParams.city) || 'Cidade';
  const stateUf = (business?.state_id || resolvedParams.state || 'sp').toLowerCase();
  const pageUrl = business
    ? `${SITE_URL}/${stateUf}/${business.city?.slug || resolvedParams.city || 'cidade'}/${business.neighborhood?.slug || resolvedParams.neighborhood || 'bairro'}/${business.slug}`
    : `${SITE_URL}/${stateUf}/${resolvedParams.city}/${resolvedParams.neighborhood}/${resolvedParams.slug}`;

  // Structured Data Schema.org (LocalBusiness & BreadcrumbList)
  const jsonLd = business
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: business.name,
        description: business.description || business.short_description,
        image: business.cover_url || business.logo_url,
        telephone: business.phone || business.whatsapp,
        url: pageUrl,
        address: {
          '@type': 'PostalAddress',
          streetAddress: `${business.address || ''}, ${business.number || ''}`,
          addressLocality: neighborhoodName,
          addressRegion: (business.state_id || resolvedParams.state || 'SP').toUpperCase(),
          postalCode: business.postal_code || '08400-000',
          addressCountry: 'BR',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: business.latitude || -23.5424,
          longitude: business.longitude || -46.4178,
        },
      }
    : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Vitriniza',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: cityName,
        item: `${SITE_URL}/buscar`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: neighborhoodName,
        item: `${SITE_URL}/${stateUf}/${business?.city?.slug || resolvedParams.city || 'cidade'}/${business?.neighborhood?.slug || resolvedParams.neighborhood || 'bairro'}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: business?.name || resolvedParams.slug,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <BusinessShowcaseClient
        initialBusiness={business || null}
        initialReviews={reviews}
        slug={resolvedParams.slug}
      />
    </>
  );
}
