import type { MetadataRoute } from 'next';
import { getSitemapRecords } from '@/lib/data/server';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { businesses, neighborhoods, categories, articles, cities } = await getSitemapRecords();
  const cityById = new Map(cities.map((city) => [city.id, city]));
  const neighborhoodById = new Map(neighborhoods.map((neighborhood) => [neighborhood.id, neighborhood]));

  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/buscar`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/descobrir`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/para-empresas`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  for (const business of businesses) {
    const city = cityById.get(business.city_id);
    const neighborhood = neighborhoodById.get(business.neighborhood_id);
    if (!city || !neighborhood) continue;

    routes.push({
      url: `${SITE_URL}/${String(business.state_id).toLowerCase()}/${city.slug}/${neighborhood.slug}/${business.slug}`,
      lastModified: business.updated_at ? new Date(business.updated_at) : undefined,
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  for (const neighborhood of neighborhoods) {
    const city = cityById.get(neighborhood.city_id);
    if (!city) continue;
    routes.push({
      url: `${SITE_URL}/${String(city.state_id).toLowerCase()}/${city.slug}/${neighborhood.slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const category of categories) {
    routes.push({
      url: `${SITE_URL}/buscar?categoria=${category.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  for (const article of articles) {
    routes.push({
      url: `${SITE_URL}/descobrir/${article.slug}`,
      lastModified: article.created_at ? new Date(article.created_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return routes;
}
