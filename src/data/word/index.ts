import { WordItem, QuizGroup } from '@/lib/quiz-types'

import basic01 from './words_basic_01_reviewed_enriched.json'
import basic02 from './words_basic_02_reviewed_enriched.json'
import basic03 from './words_basic_03_reviewed_enriched.json'
import basic04 from './words_basic_04_reviewed_enriched.json'

import beginner01 from './words_beginner_01_enriched.json'
import beginner02 from './words_beginner_02_enriched.json'
import beginner03 from './words_beginner_03_enriched.json'
import beginner04 from './words_beginner_04_enriched.json'
import beginner05 from './words_beginner_05_enriched.json'
import beginner06 from './words_beginner_06_enriched.json'

import intermediate01 from './words_intermediate_01_enriched.json'
import intermediate02 from './words_intermediate_02_enriched.json'
import intermediate03 from './words_intermediate_03_enriched.json'
import intermediate04 from './words_intermediate_04_enriched.json'
import intermediate05 from './words_intermediate_05_enriched.json'
import intermediate06 from './words_intermediate_06_enriched.json'

import advanced01 from './words_advanced_01_enriched.json'
import advanced02 from './words_advanced_02_enriched.json'
import advanced03 from './words_advanced_03_enriched.json'
import advanced04 from './words_advanced_04_enriched.json'

export const GROUP_LABELS: Record<QuizGroup, string> = {
  basic: '基礎',
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
}

export const GROUP_ORDER: QuizGroup[] = [
  'basic',
  'beginner',
  'intermediate',
  'advanced',
]

export const GROUP_DESCRIPTIONS: Record<QuizGroup, string> = {
  basic: 'あいさつや日常でよく使う基本表現を、例文ごと定着させるコースです。',
  beginner: '生活会話でよく出る語彙を増やしながら、韓国語の反応速度を上げるコースです。',
  intermediate: '説明や意見づくりに使う語彙を広げて、理解の幅を伸ばすコースです。',
  advanced: '抽象語や論理表現まで扱いながら、実践的な読解力を磨くコースです。',
}

export const WORD_GROUPS: Record<QuizGroup, WordItem[]> = {
  basic: [
    ...(basic01 as WordItem[]),
    ...(basic02 as WordItem[]),
    ...(basic03 as WordItem[]),
    ...(basic04 as WordItem[]),
  ],
  beginner: [
    ...(beginner01 as WordItem[]),
    ...(beginner02 as WordItem[]),
    ...(beginner03 as WordItem[]),
    ...(beginner04 as WordItem[]),
    ...(beginner05 as WordItem[]),
    ...(beginner06 as WordItem[]),
  ],
  intermediate: [
    ...(intermediate01 as WordItem[]),
    ...(intermediate02 as WordItem[]),
    ...(intermediate03 as WordItem[]),
    ...(intermediate04 as WordItem[]),
    ...(intermediate05 as WordItem[]),
    ...(intermediate06 as WordItem[]),
  ],
  advanced: [
    ...(advanced01 as WordItem[]),
    ...(advanced02 as WordItem[]),
    ...(advanced03 as WordItem[]),
    ...(advanced04 as WordItem[]),
  ],
}

export function getWordsByGroup(group: QuizGroup) {
  return WORD_GROUPS[group] ?? []
}
