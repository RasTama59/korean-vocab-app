import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/page-metadata'

export const metadata: Metadata = createPageMetadata({
  title: '例文クイズ設定',
  description: '例文クイズの設定画面です。',
  path: '/quiz',
  noIndex: true,
})

export default function QuizSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
