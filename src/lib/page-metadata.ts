import type { Metadata } from 'next'
import {
  getAbsoluteUrl,
  SOCIAL_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
} from '@/lib/site'

type CreatePageMetadataOptions = {
  title: string
  description?: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
}

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '/',
  keywords = [],
  noIndex = false,
}: CreatePageMetadataOptions): Metadata {
  const socialImageUrl = getAbsoluteUrl(SOCIAL_IMAGE_PATH)

  return {
    title,
    description,
    keywords: [...SITE_KEYWORDS, ...keywords],
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      locale: 'ja_JP',
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: socialImageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} の共有画像`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        },
  }
}
