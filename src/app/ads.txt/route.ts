function getAdsensePublisherId() {
  const rawValue =
    process.env.ADSENSE_CLIENT?.trim() ?? process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim()

  if (!rawValue) {
    return null
  }

  if (rawValue.startsWith('pub-')) {
    return rawValue
  }

  if (rawValue.startsWith('ca-pub-')) {
    return rawValue.replace(/^ca-/, '')
  }

  return null
}

export async function GET() {
  const publisherId = getAdsensePublisherId()

  if (!publisherId) {
    return new Response('Not Found', {
      status: 404,
    })
  }

  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
