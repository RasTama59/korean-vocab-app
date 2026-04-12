import type { MetadataRoute } from 'next'
import { GROUP_ORDER } from '@/data/word'
import { getAbsoluteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: getAbsoluteUrl('/'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: getAbsoluteUrl('/about'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: getAbsoluteUrl('/policy'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: getAbsoluteUrl('/request'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: getAbsoluteUrl('/words'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl('/keyboard'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: getAbsoluteUrl('/word-quiz'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  const courseRoutes: MetadataRoute.Sitemap = GROUP_ORDER.map((group) => ({
    url: getAbsoluteUrl(`/quiz/${group}`),
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...courseRoutes]
}
