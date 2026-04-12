import type { MetadataRoute } from 'next'
import { getAbsoluteUrl, getSiteUrlString } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/quiz/*/play',
          '/quiz/*/settings',
          '/word-quiz/settings',
          '/word-quiz/*/settings',
        ],
      },
    ],
    sitemap: getAbsoluteUrl('/sitemap.xml'),
    host: getSiteUrlString(),
  }
}
