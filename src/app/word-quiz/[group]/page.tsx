import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GROUP_LABELS, GROUP_ORDER } from '@/data/word'
import { createPageMetadata } from '@/lib/page-metadata'
import type { QuizGroup } from '@/lib/quiz-types'
import { WordQuizPlayer } from './word-quiz-player'

type PageProps = {
  params: Promise<{
    group: string
  }>
  searchParams: Promise<{
    mode?: string
  }>
}

export async function generateMetadata({ params }: Pick<PageProps, 'params'>): Promise<Metadata> {
  const { group } = await params

  if (!GROUP_ORDER.includes(group as QuizGroup)) {
    return createPageMetadata({
      title: '単語クイズ',
      path: '/word-quiz',
      noIndex: true,
    })
  }

  return createPageMetadata({
    title: `${GROUP_LABELS[group as QuizGroup]}の単語クイズ`,
    description:
      '出題中の単語クイズ画面です。検索結果ではなく、単語クイズ一覧からの利用を想定しています。',
    path: `/word-quiz/${group}`,
    noIndex: true,
  })
}

export default async function WordQuizGroupPage({ params, searchParams }: PageProps) {
  const { group } = await params
  const { mode } = await searchParams

  if (!GROUP_ORDER.includes(group as QuizGroup)) {
    notFound()
  }

  return <WordQuizPlayer group={group as QuizGroup} initialMode={mode === 'mistakes' ? 'mistakes' : 'all'} />
}
