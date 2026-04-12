import { notFound } from 'next/navigation'
import { GROUP_ORDER } from '@/data/word'
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

export default async function WordQuizGroupPage({ params, searchParams }: PageProps) {
  const { group } = await params
  const { mode } = await searchParams

  if (!GROUP_ORDER.includes(group as QuizGroup)) {
    notFound()
  }

  return <WordQuizPlayer group={group as QuizGroup} initialMode={mode === 'mistakes' ? 'mistakes' : 'all'} />
}
