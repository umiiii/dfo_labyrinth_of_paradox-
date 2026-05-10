import type { MetadataRoute } from 'next';
import { FLOOR_ROUTES } from '@/lib/labyrinth-routes';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dnf.umi.cat';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const home: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 1,
  };

  const areas = Array.from(
    new Set(Object.keys(FLOOR_ROUTES).map((k) => k.split('/')[0])),
  ).map<MetadataRoute.Sitemap[number]>((n) => ({
    url: `${SITE_URL}/?area=${n}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const floors = Object.keys(FLOOR_ROUTES).map<MetadataRoute.Sitemap[number]>(
    (k) => ({
      url: `${SITE_URL}/labyrinth/${k}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    }),
  );

  return [home, ...areas, ...floors];
}
