import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/page-metadata'

export const metadata: Metadata = createPageMetadata({
  title: '単語クイズ設定',
  description: '単語クイズの設定画面です。',
  path: '/word-quiz',
  noIndex: true,
})

export default function WordQuizSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
