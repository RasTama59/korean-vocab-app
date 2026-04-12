import type { Metadata } from 'next'
import { GROUP_LABELS, GROUP_ORDER, WORD_GROUPS } from '@/data/word'
import { createPageMetadata } from '@/lib/page-metadata'
import type { QuizGroup, WordItem } from '@/lib/quiz-types'
import WordLibrary from './word-library'

type LibraryWord = WordItem & {
  group: QuizGroup
}

const words: LibraryWord[] = GROUP_ORDER.flatMap((group) =>
  WORD_GROUPS[group].map((word) => ({
    ...word,
    group,
  }))
)

const levelOptions = GROUP_ORDER.map((group) => ({
  value: group,
  label: GROUP_LABELS[group],
  count: WORD_GROUPS[group].length,
}))

const genreOptions = Array.from(new Set(words.flatMap((word) => word.genres))).sort((left, right) =>
  left.localeCompare(right, 'ja')
)

export const metadata: Metadata = createPageMetadata({
  title: '単語一覧',
  description:
    '韓国語の単語をレベルやジャンルで絞り込みながら、意味・発音・例文を一覧で確認できるページです。',
  path: '/words',
  keywords: ['韓国語 単語一覧', '韓国語 単語 検索'],
})

export default function WordsPage() {
  return <WordLibrary words={words} levelOptions={levelOptions} genreOptions={genreOptions} />
}
