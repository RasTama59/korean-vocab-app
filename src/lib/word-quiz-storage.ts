import type { QuizGroup } from './quiz-types'

export type WordQuizSettings = {
  questionCount: number
}

const STORAGE_KEY = 'korean-lean-word-quiz-settings-v1'

export const WORD_QUIZ_DEFAULT_QUESTION_COUNT = 10
export const WORD_QUIZ_QUESTION_STEP = 10

const defaultSettings: WordQuizSettings = {
  questionCount: WORD_QUIZ_DEFAULT_QUESTION_COUNT,
}

type LegacyWordQuizSettingsState = Partial<
  Record<QuizGroup, { questionCount?: number }>
>

function normalizeQuestionCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function getLegacyQuestionCount(parsed: LegacyWordQuizSettingsState) {
  const candidateKeys: QuizGroup[] = ['basic', 'beginner', 'intermediate', 'advanced']

  for (const key of candidateKeys) {
    const value = normalizeQuestionCount(parsed[key]?.questionCount)
    if (value !== null) {
      return value
    }
  }

  return null
}

export function loadWordQuizSettings(): WordQuizSettings {
  if (typeof window === 'undefined') return { ...defaultSettings }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...defaultSettings }

  try {
    const parsed = JSON.parse(raw) as
      | Partial<WordQuizSettings>
      | LegacyWordQuizSettingsState

    const directCount = normalizeQuestionCount((parsed as Partial<WordQuizSettings>).questionCount)

    if (directCount !== null) {
      return { questionCount: directCount }
    }

    const legacyCount = getLegacyQuestionCount(parsed as LegacyWordQuizSettingsState)

    if (legacyCount !== null) {
      return { questionCount: legacyCount }
    }

    return { ...defaultSettings }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveWordQuizSettings(settings: WordQuizSettings) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function updateWordQuizSettings(
  settings: WordQuizSettings,
  nextSettings: Partial<WordQuizSettings>
): WordQuizSettings {
  return {
    ...settings,
    ...nextSettings,
  }
}
