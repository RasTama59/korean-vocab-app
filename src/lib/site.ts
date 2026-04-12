export const SITE_NAME = 'Korean Lean'
export const SITE_DESCRIPTION =
  '韓国語の語彙学習を、例文クイズ・単語クイズ・一覧・タイピングで続けやすくするための学習サイトです。'
export const SITE_KEYWORDS = [
  '韓国語',
  '韓国語 学習',
  '韓国語 単語',
  '韓国語 クイズ',
  '韓国語 例文',
  '韓国語 タイピング',
  'ハングル 学習',
  'Korean Lean',
]
export const SOCIAL_IMAGE_PATH = '/opengraph-image'

function normalizeSiteUrl(url: string) {
  const trimmed = url.trim()

  if (!trimmed) {
    return 'http://localhost:3000'
  }

  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`

  return withProtocol.replace(/\/+$/, '')
}

export function getSiteUrlString() {
  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.SITE_URL ??
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.VERCEL_URL ??
      'http://localhost:3000'
  )
}

export function getSiteUrl() {
  return new URL(getSiteUrlString())
}

export function getAbsoluteUrl(path = '/') {
  return new URL(path, getSiteUrl()).toString()
}
