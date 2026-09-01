import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { store } from '@/lib/data/store';
import { BusinessShowcaseClient } from '@/components/business/BusinessShowcaseClient';

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
  const business = store.getBusinessBySlug(resolvedParams.slug);

  if (!business) {
    return {
      title: 'Negócio não encontrado | Vitriniza',
      description: 'O comércio ou profissional procurado não foi encontrado na Vitriniza.',
    };
  }

  const neighborhoodName = business.neighborhood?.name || 'Guaianases';
  const cityName = business.city?.name || 'São Paulo';
  const pageTitle = `${business.name} em ${neighborhoodName} | Vitriniza`;
  const pageDescription = `Conheça ${business.name} em ${neighborhoodName}, ${cityName}. Veja produtos, ofertas, endereço, horário e fale diretamente pelo WhatsApp.`;
  const pageUrl = `https://vitriniza.vercel.app/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'guaianases'}/${business.slug}`;
  const shareImage = business.cover_url || business.logo_url || 'https://vitriniza.vercel.app/logo.png';

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
  const business = store.getBusinessBySlug(resolvedParams.slug);

  if (!business) {
    notFound();
  }

  const reviews = store.getReviews(business.id);
  const neighborhoodName = business.neighborhood?.name || 'Guaianases';
  const cityName = business.city?.name || 'São Paulo';
  const pageUrl = `https://vitriniza.vercel.app/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'guaianases'}/${business.slug}`;

  // Structured Data Schema.org (LocalBusiness & BreadcrumbList)
  const jsonLd = {
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
      addressRegion: 'SP',
      postalCode: business.postal_code || '08400-000',
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.latitude || -23.5424,
      longitude: business.longitude || -46.4178,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Vitriniza',
        item: 'https://vitriniza.vercel.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: cityName,
        item: 'https://vitriniza.vercel.app/buscar',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: neighborhoodName,
        item: `https://vitriniza.vercel.app/sp/sao-paulo/${business.neighborhood?.slug || 'guaianases'}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: business.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BusinessShowcaseClient initialBusiness={business} initialReviews={reviews} />
    </>
  );
}
