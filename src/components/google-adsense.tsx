import Script from 'next/script'

const ADSENSE_CLIENT =
  process.env.ADSENSE_CLIENT?.trim() ?? process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim()

export function GoogleAdSense() {
  if (!ADSENSE_CLIENT) {
    return null
  }

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      strategy="beforeInteractive"
      crossOrigin="anonymous"
    />
  )
}
