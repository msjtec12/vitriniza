import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicPlaceBySlug } from '@/lib/data/server';
import { getPlaceCategoryMeta, getPlaceImage, getPlaceSchemaType } from '@/lib/places';
import { PlaceDetailClient } from '@/components/place/PlaceDetailClient';
import { SITE_URL } from '@/lib/site';
import { serializeJsonLd } from '@/lib/security/json-ld.mjs';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPublicPlaceBySlug(slug);

  if (!place) {
    return {
      title: 'Local não encontrado | Vitriniza',
      description: 'O local público solicitado não foi encontrado.',
    };
  }

  const meta = getPlaceCategoryMeta(place.category_group);
  const title = `${place.name} - ${place.subcategory || meta.label} | Guia Vitriniza`;
  const description =
    place.short_description ||
    `${place.name} em ${place.neighborhood?.name || place.neighborhood_name || 'São Paulo'}. Endereço, horários de atendimento, rotas e comércios no entorno.`;

  const placeUrl = `${SITE_URL}/lugares/${place.slug}`;
  const imageSource = getPlaceImage(place).src;
  const image = imageSource.startsWith('/') ? `${SITE_URL}${imageSource}` : imageSource;

  return {
    title,
    description,
    alternates: {
      canonical: placeUrl,
    },
    openGraph: {
      title,
      description,
      url: placeUrl,
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const place = await getPublicPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  const meta = getPlaceCategoryMeta(place.category_group);
  const placeUrl = `${SITE_URL}/lugares/${place.slug}`;

  // Structured Data Schema.org
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': getPlaceSchemaType(place.category_group),
    name: place.name,
    description: place.description || place.short_description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${place.address}${place.number ? `, ${place.number}` : ''}`,
      postalCode: place.postal_code || undefined,
      addressLocality: place.city?.name || place.city_name || 'São Paulo',
      addressRegion: place.state_id || 'SP',
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.latitude,
      longitude: place.longitude,
    },
    telephone: place.phone || undefined,
    url: place.website || placeUrl,
  };

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
        name: 'Guia de Locais',
        item: `${SITE_URL}/buscar?tipo=places`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: meta.label,
        item: `${SITE_URL}/buscar?tipo=places&grupo=${place.category_group}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: place.name,
        item: placeUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <PlaceDetailClient place={place} />
    </>
  );
}
