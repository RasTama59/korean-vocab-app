import type { QuizGroup } from '@/lib/quiz-types'

const STORAGE_KEY = 'korean-lean-favorite-words-v1'

export function makeFavoriteWordKey(group: QuizGroup, wordId: number) {
  return `${group}:${wordId}`
}

function normalizeFavoriteKeys(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is string => typeof item === 'string')
}

export function loadFavoriteWordKeys() {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    return normalizeFavoriteKeys(JSON.parse(raw))
  } catch {
    return []
  }
}

export function saveFavoriteWordKeys(keys: string[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(keys))))
}

export function toggleFavoriteWordKey(
  keys: string[],
  group: QuizGroup,
  wordId: number
) {
  const key = makeFavoriteWordKey(group, wordId)

  if (keys.includes(key)) {
    return keys.filter((item) => item !== key)
  }

  return [...keys, key]
}
