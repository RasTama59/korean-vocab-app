import { GROUP_LABELS } from '@/data/word'
import type { QuizGroup } from '@/lib/quiz-types'

export type WordReportSource = 'word-library' | 'example-quiz' | 'word-quiz'

export const REPORT_SOURCE_LABELS: Record<WordReportSource, string> = {
  'word-library': '単語一覧',
  'example-quiz': '例文クイズ',
  'word-quiz': '単語クイズ',
}

export const WORD_REPORT_FORM_PUBLIC_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSciloSqoAM8gNziJlr2Ih9GIJL4fytn2fDzddXszjWCcX7OGQ/viewform?usp=header'

const WORD_REPORT_FORM_PREFILL_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSciloSqoAM8gNziJlr2Ih9GIJL4fytn2fDzddXszjWCcX7OGQ/viewform'

const WORD_REPORT_FORM_ENTRY_ID = 'entry.1513209720'

type WordReportLinkInput = {
  group: QuizGroup
  id: number
  meaning: string
  source: WordReportSource
  word: string
}

function buildWordReportBody({ group, id, meaning, source, word }: WordReportLinkInput) {
  return [
    `単語: ${word}`,
    `意味: ${meaning}`,
    `ID: ${id}`,
    `レベル: ${GROUP_LABELS[group]}`,
    `報告元: ${REPORT_SOURCE_LABELS[source]}`,
  ].join('\n')
}

export function buildWordReportHref(input: WordReportLinkInput) {
  const params = new URLSearchParams()
  params.set('usp', 'pp_url')
  params.set(WORD_REPORT_FORM_ENTRY_ID, buildWordReportBody(input))

  return `${WORD_REPORT_FORM_PREFILL_URL}?${params.toString()}`
}
