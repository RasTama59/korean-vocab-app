import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GROUP_DESCRIPTIONS, GROUP_LABELS, GROUP_ORDER } from '@/data/word'
import { createPageMetadata } from '@/lib/page-metadata'
import type { QuizGroup } from '@/lib/quiz-types'
import { QuizGroupClientPage } from './quiz-group-page'

type PageProps = {
  params: Promise<{
    group: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { group } = await params

  if (!GROUP_ORDER.includes(group as QuizGroup)) {
    return createPageMetadata({
      title: '例文クイズ',
      path: '/quiz',
      noIndex: true,
    })
  }

  return createPageMetadata({
    title: `${GROUP_LABELS[group as QuizGroup]}コース`,
    description: GROUP_DESCRIPTIONS[group as QuizGroup],
    path: `/quiz/${group}`,
    keywords: ['韓国語 例文クイズ'],
  })
}

export default async function QuizGroupPage({ params }: PageProps) {
  const { group } = await params

  if (!GROUP_ORDER.includes(group as QuizGroup)) {
    notFound()
  }

  return <QuizGroupClientPage group={group as QuizGroup} />
}
