import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/page-metadata'

export const metadata: Metadata = createPageMetadata({
  title: '例文クイズ',
  description: '出題中の例文クイズ画面です。',
  path: '/quiz',
  noIndex: true,
})

export default function QuizPlayLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
