export type QuizGroup = 'basic' | 'beginner' | 'intermediate' | 'advanced'

export type StudyStatus = 0 | 1 | 2
// 0 = 未習得
// 1 = 要復習
// 2 = 習得済

export type RelatedWord = {
  word: string
  meaning: string
}

export type WordItem = {
  id: number
  word: string
  baseForm?: string
  highlightText?: string
  readingKatakana?: string
  romanization?: string
  meaning: string
  partOfSpeech: string
  levelGroup?: string
  difficultyLevel?: number
  genres: string[]
  formality?: string
  example: string
  exampleTranslation: string
  description?: string
  usage?: string
  hint?: string
  acceptedAnswers?: string[]
  synonyms?: RelatedWord[]
  antonyms?: RelatedWord[]
}

export type WordProgress = {
  status: StudyStatus
  correctCount: number
  wrongCount: number
  updatedAt: number
}

export type GroupSettings = {
  reviewTargets: StudyStatus[]
  questionCount: number
}

export type GroupState = {
  progressById: Record<number, WordProgress>
  settings: GroupSettings
}

export type QuizState = Record<QuizGroup, GroupState>