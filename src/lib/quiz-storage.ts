import { GroupSettings, QuizGroup, QuizState, StudyStatus, WordProgress } from './quiz-types'

const STORAGE_KEY = 'korean-lean-quiz-state-v1'

const defaultSettings: GroupSettings = {
  reviewTargets: [1], // 最初は要復習だけ
  questionCount: 30,
}

function createEmptyState(): QuizState {
  return {
    basic: {
      progressById: {},
      settings: { ...defaultSettings },
    },
    beginner: {
      progressById: {},
      settings: { ...defaultSettings },
    },
    intermediate: {
      progressById: {},
      settings: { ...defaultSettings },
    },
    advanced: {
      progressById: {},
      settings: { ...defaultSettings },
    },
  }
}

export function loadQuizState(): QuizState {
  if (typeof window === 'undefined') return createEmptyState()

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return createEmptyState()

  try {
    const parsed = JSON.parse(raw) as QuizState
    return {
      ...createEmptyState(),
      ...parsed,
    }
  } catch {
    return createEmptyState()
  }
}

export function saveQuizState(state: QuizState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getWordProgress(
  state: QuizState,
  group: QuizGroup,
  wordId: number
): WordProgress {
  return (
    state[group].progressById[wordId] ?? {
      status: 0,
      correctCount: 0,
      wrongCount: 0,
      updatedAt: Date.now(),
    }
  )
}

export function markKnown(
  state: QuizState,
  group: QuizGroup,
  wordId: number
): QuizState {
  const current = getWordProgress(state, group, wordId)
  const nextStatus = Math.min(2, current.status + 1) as StudyStatus

  const next: QuizState = structuredClone(state)
  next[group].progressById[wordId] = {
    ...current,
    status: nextStatus,
    correctCount: current.correctCount + 1,
    updatedAt: Date.now(),
  }
  return next
}

export function markUnknown(
  state: QuizState,
  group: QuizGroup,
  wordId: number
): QuizState {
  const current = getWordProgress(state, group, wordId)

  let nextStatus: StudyStatus = 0
  if (current.status === 2) nextStatus = 1
  if (current.status === 1) nextStatus = 0
  if (current.status === 0) nextStatus = 0

  const next: QuizState = structuredClone(state)
  next[group].progressById[wordId] = {
    ...current,
    status: nextStatus,
    wrongCount: current.wrongCount + 1,
    updatedAt: Date.now(),
  }
  return next
}

export function updateGroupSettings(
  state: QuizState,
  group: QuizGroup,
  settings: GroupSettings
): QuizState {
  const next: QuizState = structuredClone(state)
  next[group].settings = settings
  return next
}

export function getCounts(
  state: QuizState,
  group: QuizGroup,
  wordIds: number[]
) {
  let unlearned = 0
  let review = 0
  let mastered = 0

  for (const id of wordIds) {
    const status = getWordProgress(state, group, id).status
    if (status === 0) unlearned++
    if (status === 1) review++
    if (status === 2) mastered++
  }

  return { unlearned, review, mastered }
}

export function shuffleArray<T>(items: T[]) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}