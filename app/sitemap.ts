import { MetadataRoute } from 'next';
import { store } from '@/lib/data/store';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vitriniza.com.br';
  const businesses = store.getBusinesses();
  const neighborhoods = store.getNeighborhoods();
  const categories = store.getCategories();
  const articles = store.getArticles();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/descobrir`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/para-empresas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Business pages
  businesses.forEach((b) => {
    routes.push({
      url: `${baseUrl}/${b.state_id.toLowerCase()}/${b.city?.slug || 'sao-paulo'}/${b.neighborhood?.slug || 'guaianases'}/${b.slug}`,
      lastModified: new Date(b.updated_at),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  });

  // Neighborhood pages
  neighborhoods.forEach((n) => {
    routes.push({
      url: `${baseUrl}/sp/sao-paulo/${n.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Articles
  articles.forEach((a) => {
    routes.push({
      url: `${baseUrl}/descobrir/${a.slug}`,
      lastModified: new Date(a.created_at),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  return routes;
}
