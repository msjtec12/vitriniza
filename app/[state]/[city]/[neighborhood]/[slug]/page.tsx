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
    (process.env.NODE_ENV !== 'production' ? store.getBusinessBySlug(resolvedParams.slug) : null);

  if (!business) {
    return {
      title: `${resolvedParams.slug} | Vitriniza`,
      description: 'Conheça os produtos, serviços e ofertas deste estabelecimento na Vitriniza.',
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
  const pageTitle = `${business.name} em ${neighborhoodName} | Vitriniza`;
  const pageDescription = `Conheça ${business.name} em ${neighborhoodName}, ${cityName}. Veja produtos, ofertas, endereço, horário e fale diretamente pelo WhatsApp.`;
  const pageUrl = `${SITE_URL}/${stateUf}/${business.city?.slug || resolvedParams.city || 'cidade'}/${business.neighborhood?.slug || resolvedParams.neighborhood || 'bairro'}/${business.slug}`;
  const shareImage = business.cover_url || business.logo_url || `${SITE_URL}/logo.png`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      business.name,
      neighborhoodName,
      cityName,
      business.category?.name || 'comércio local',
      'Vitriniza',
      'WhatsApp comércio',
    ],
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: pageUrl,
      siteName: 'Vitriniza',
      locale: 'pt_BR',
      type: 'website',
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: `${business.name} - Vitriniza ${neighborhoodName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [shareImage],
    },
  };
}

export default async function BusinessShowcasePage({ params }: PageProps) {
  const resolvedParams = await params;
  const business =
    (await getPublicBusinessBySlug(resolvedParams.slug)) ||
    (process.env.NODE_ENV !== 'production' ? store.getBusinessBySlug(resolvedParams.slug) : null);

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
