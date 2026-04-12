import type { QuizGroup, WordItem } from '@/lib/quiz-types'
import { buildWordReportHref, type WordReportSource } from '@/lib/word-report'
import styles from './word-report-link.module.css'

type WordReportLinkProps = {
  group: QuizGroup
  source: WordReportSource
  word: Pick<WordItem, 'id' | 'meaning' | 'word'>
}

export function WordReportLink({ group, source, word }: WordReportLinkProps) {
  const href = buildWordReportHref({
    group,
    id: word.id,
    meaning: word.meaning,
    source,
    word: word.word,
  })

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={styles.link}
      aria-label={`${word.word} の内容を事前入力した報告フォームを開く`}
      title={`${word.word} の報告フォームを開く`}
    >
      報告
    </a>
  )
}
