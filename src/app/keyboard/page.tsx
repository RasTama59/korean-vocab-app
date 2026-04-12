import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/page-metadata'
import { KeyboardPageClient } from './keyboard-page'

export const metadata: Metadata = createPageMetadata({
  title: 'キーボード練習',
  description:
    'ハングルキーボードの配置を確認しながら、単語を入力してタイピング感覚を育てられる練習ページです。',
  path: '/keyboard',
  keywords: ['ハングル キーボード', '韓国語 タイピング'],
})

export default function KeyboardPage() {
  return <KeyboardPageClient />
}
