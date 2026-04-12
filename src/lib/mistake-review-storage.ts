import type { QuizGroup } from '@/lib/quiz-types'

export type MistakeReviewKind = 'example-quiz' | 'word-quiz'

type MistakeReviewState = Record<QuizGroup, number[]>

const STORAGE_KEYS: Record<MistakeReviewKind, string> = {
  'example-quiz': 'korean-lean-example-quiz-mistakes-v1',
  'word-quiz': 'korean-lean-word-quiz-mistakes-v1',
}

function createEmptyState(): MistakeReviewState {
  return {
    basic: [],
    beginner: [],
    intermediate: [],
    advanced: [],
  }
}

function normalizeWordIds(value: unknown) {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    )
  )
}

function loadMistakeReviewState(kind: MistakeReviewKind) {
  if (typeof window === 'undefined') return createEmptyState()

  const raw = window.localStorage.getItem(STORAGE_KEYS[kind])
  if (!raw) return createEmptyState()

  try {
    const parsed = JSON.parse(raw) as Partial<MistakeReviewState>

    return {
      basic: normalizeWordIds(parsed.basic),
      beginner: normalizeWordIds(parsed.beginner),
      intermediate: normalizeWordIds(parsed.intermediate),
      advanced: normalizeWordIds(parsed.advanced),
    }
  } catch {
    return createEmptyState()
  }
}

function saveMistakeReviewState(kind: MistakeReviewKind, state: MistakeReviewState) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(state))
}

export function loadMistakeWordIds(kind: MistakeReviewKind, group: QuizGroup) {
  return loadMistakeReviewState(kind)[group]
}

export function saveMistakeWordIds(
  kind: MistakeReviewKind,
  group: QuizGroup,
  wordIds: number[]
) {
  const state = loadMistakeReviewState(kind)
  state[group] = normalizeWordIds(wordIds)
  saveMistakeReviewState(kind, state)
}

export function clearMistakeWordIds(kind: MistakeReviewKind, group: QuizGroup) {
  const state = loadMistakeReviewState(kind)
  state[group] = []
  saveMistakeReviewState(kind, state)
}
