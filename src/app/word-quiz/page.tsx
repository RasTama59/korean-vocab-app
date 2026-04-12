import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/page-metadata'
import { WordQuizLevelClientPage } from './word-quiz-level-page'

export const metadata: Metadata = createPageMetadata({
  title: '単語クイズ',
  description:
    '韓国語の単語を見て4択から意味を選ぶ、短いサイクルで復習しやすい単語クイズのトップページです。',
  path: '/word-quiz',
  keywords: ['韓国語 単語クイズ', '韓国語 4択'],
})

export default function WordQuizLevelPage() {
  return <WordQuizLevelClientPage />
}
