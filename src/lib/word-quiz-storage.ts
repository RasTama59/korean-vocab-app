import type { QuizGroup, StudyStatus } from './quiz-types'

export type WordQuizQuestionScope = 'all' | 'frequent-mistakes'

export type WordQuizSettings = {
  hideChoicesInitially: boolean
  questionCount: number
  questionScope: WordQuizQuestionScope
  randomStatusFilters: StudyStatus[]
}

export type WordQuizProgress = {
  correctCount: number
  updatedAt: number
  wrongCount: number
}

type WordQuizProgressState = Record<QuizGroup, Record<number, WordQuizProgress>>

const SETTINGS_STORAGE_KEY = 'korean-lean-word-quiz-settings-v1'
const PROGRESS_STORAGE_KEY = 'korean-lean-word-quiz-progress-v1'

export const WORD_QUIZ_DEFAULT_QUESTION_COUNT = 10
export const WORD_QUIZ_QUESTION_STEP = 10
export const WORD_QUIZ_FREQUENT_MISTAKE_MIN_WRONG_COUNT = 2
export const WORD_QUIZ_ALL_STATUS_FILTERS: StudyStatus[] = [0, 1, 2]

const defaultSettings: WordQuizSettings = {
  hideChoicesInitially: false,
  questionCount: WORD_QUIZ_DEFAULT_QUESTION_COUNT,
  questionScope: 'all',
  randomStatusFilters: [...WORD_QUIZ_ALL_STATUS_FILTERS],
}

type LegacyWordQuizSettingsState = Partial<
  Record<QuizGroup, { questionCount?: number }>
>

function createEmptyProgressState(): WordQuizProgressState {
  return {
    basic: {},
    beginner: {},
    intermediate: {},
    advanced: {},
  }
}

function normalizeQuestionCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function normalizeQuestionScope(value: unknown): WordQuizQuestionScope | null {
  return value === 'all' || value === 'frequent-mistakes' ? value : null
}

function normalizeHideChoicesInitially(value: unknown) {
  return typeof value === 'boolean' ? value : null
}

function normalizeStatusFilters(value: unknown): StudyStatus[] | null {
  if (!Array.isArray(value)) return null

  const next = Array.from(
    new Set(
      value.filter(
        (item): item is StudyStatus => (item === 0 || item === 1 || item === 2)
      )
    )
  ).sort((left, right) => left - right) as StudyStatus[]

  return next.length > 0 ? next : null
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

  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (!raw) return { ...defaultSettings }

  try {
    const parsed = JSON.parse(raw) as
      | Partial<WordQuizSettings>
      | LegacyWordQuizSettingsState

    const directCount = normalizeQuestionCount((parsed as Partial<WordQuizSettings>).questionCount)

    if (directCount !== null) {
      return {
        hideChoicesInitially:
          normalizeHideChoicesInitially(
            (parsed as Partial<WordQuizSettings>).hideChoicesInitially
          ) ?? defaultSettings.hideChoicesInitially,
        questionCount: directCount,
        questionScope:
          normalizeQuestionScope((parsed as Partial<WordQuizSettings>).questionScope) ??
          defaultSettings.questionScope,
        randomStatusFilters:
          normalizeStatusFilters((parsed as Partial<WordQuizSettings>).randomStatusFilters) ??
          [...defaultSettings.randomStatusFilters],
      }
    }

    const legacyCount = getLegacyQuestionCount(parsed as LegacyWordQuizSettingsState)

    if (legacyCount !== null) {
      return {
        ...defaultSettings,
        questionCount: legacyCount,
      }
    }

    return { ...defaultSettings }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveWordQuizSettings(settings: WordQuizSettings) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
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

function normalizeProgressEntry(value: unknown): WordQuizProgress | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<WordQuizProgress>
  const correctCount =
    typeof candidate.correctCount === 'number' && Number.isFinite(candidate.correctCount)
      ? Math.max(0, candidate.correctCount)
      : 0
  const wrongCount =
    typeof candidate.wrongCount === 'number' && Number.isFinite(candidate.wrongCount)
      ? Math.max(0, candidate.wrongCount)
      : 0
  const updatedAt =
    typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt)
      ? candidate.updatedAt
      : 0

  return {
    correctCount,
    updatedAt,
    wrongCount,
  }
}

function normalizeProgressGroup(value: unknown) {
  if (!value || typeof value !== 'object') return {}

  return Object.entries(value as Record<string, unknown>).reduce<Record<number, WordQuizProgress>>(
    (accumulator, [key, entry]) => {
      const numericKey = Number(key)

      if (!Number.isInteger(numericKey)) {
        return accumulator
      }

      const normalizedEntry = normalizeProgressEntry(entry)

      if (!normalizedEntry) {
        return accumulator
      }

      accumulator[numericKey] = normalizedEntry
      return accumulator
    },
    {}
  )
}

export function loadWordQuizProgressState(): WordQuizProgressState {
  if (typeof window === 'undefined') return createEmptyProgressState()

  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
  if (!raw) return createEmptyProgressState()

  try {
    const parsed = JSON.parse(raw) as Partial<Record<QuizGroup, unknown>>

    return {
      basic: normalizeProgressGroup(parsed.basic),
      beginner: normalizeProgressGroup(parsed.beginner),
      intermediate: normalizeProgressGroup(parsed.intermediate),
      advanced: normalizeProgressGroup(parsed.advanced),
    }
  } catch {
    return createEmptyProgressState()
  }
}

function saveWordQuizProgressState(state: WordQuizProgressState) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state))
}

export function getWordQuizProgress(group: QuizGroup, wordId: number): WordQuizProgress {
  return (
    loadWordQuizProgressState()[group][wordId] ?? {
      correctCount: 0,
      updatedAt: 0,
      wrongCount: 0,
    }
  )
}

export function recordWordQuizAnswer(group: QuizGroup, wordId: number, isCorrect: boolean) {
  const state = loadWordQuizProgressState()
  const current = state[group][wordId] ?? {
    correctCount: 0,
    updatedAt: 0,
    wrongCount: 0,
  }

  state[group][wordId] = {
    correctCount: current.correctCount + (isCorrect ? 1 : 0),
    updatedAt: Date.now(),
    wrongCount: current.wrongCount + (isCorrect ? 0 : 1),
  }

  saveWordQuizProgressState(state)
}

export function getFrequentMistakeWordIds(group: QuizGroup) {
  const progressById = loadWordQuizProgressState()[group]

  return Object.entries(progressById)
    .filter(([, progress]) => progress.wrongCount >= WORD_QUIZ_FREQUENT_MISTAKE_MIN_WRONG_COUNT)
    .sort((left, right) => {
      const [, leftProgress] = left
      const [, rightProgress] = right

      if (rightProgress.wrongCount !== leftProgress.wrongCount) {
        return rightProgress.wrongCount - leftProgress.wrongCount
      }

      return rightProgress.updatedAt - leftProgress.updatedAt
    })
    .map(([wordId]) => Number(wordId))
}

export function getFrequentMistakeCount(group: QuizGroup) {
  return getFrequentMistakeWordIds(group).length
}
