'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FavoriteButton } from '@/components/favorite-button'
import { WordReportLink } from '@/components/word-report-link'
import {
  GROUP_DESCRIPTIONS,
  GROUP_LABELS,
  GROUP_ORDER,
  WORD_GROUPS,
  getWordsByGroup,
} from '@/data/word'
import { playQuizSound } from '@/lib/quiz-audio'
import {
  loadFavoriteWordKeys,
  makeFavoriteWordKey,
  saveFavoriteWordKeys,
  toggleFavoriteWordKey,
} from '@/lib/favorite-words'
import { loadMistakeWordIds, saveMistakeWordIds } from '@/lib/mistake-review-storage'
import { speakKorean, stopSpeaking } from '@/lib/quiz-tts'
import {
  getWordProgress,
  loadQuizState,
  markKnown,
  markUnknown,
  saveQuizState,
} from '@/lib/quiz-storage'
import type { QuizGroup, StudyStatus, WordItem } from '@/lib/quiz-types'
import {
  getFrequentMistakeWordIds,
  loadWordQuizSettings,
  recordWordQuizAnswer,
  WORD_QUIZ_DEFAULT_QUESTION_COUNT,
  type WordQuizQuestionScope,
} from '@/lib/word-quiz-storage'
import styles from './word-quiz-player.module.css'

type WordQuizMode = 'all' | 'mistakes' | 'check' | 'check-mistakes'
type CheckAnswerChoice = 'known' | 'unknown'

type ChoiceEntry = {
  choices: string[]
  item: WordItem
  kind: 'choice'
}

type CheckEntry = {
  item: WordItem
  kind: 'check'
}

type WordQuizResult = {
  correctAnswer: string
  isCorrect: boolean
  question: ChoiceEntry
  selectedAnswer: string
}

type CheckSessionAnswer = {
  response: CheckAnswerChoice
  word: WordItem
}

type WordQuizEntry = ChoiceEntry | CheckEntry

function isCheckMode(mode: WordQuizMode): mode is 'check' | 'check-mistakes' {
  return mode === 'check' || mode === 'check-mistakes'
}

function getModeLabel(mode: WordQuizMode, questionScope: WordQuizQuestionScope) {
  if (mode === 'mistakes') return '4択ミス復習'
  if (mode === 'check') return 'わかる / わからない'
  if (mode === 'check-mistakes') return 'わからない復習'
  if (questionScope === 'frequent-mistakes') return '苦手復習'
  return '単語クイズ'
}

function getModeTitle(group: QuizGroup, mode: WordQuizMode) {
  return isCheckMode(mode)
    ? `${GROUP_LABELS[group]}レベルの単語を仕分ける`
    : `${GROUP_LABELS[group]}レベルの意味を選ぶ`
}

function getModeDescription(group: QuizGroup, mode: WordQuizMode) {
  if (isCheckMode(mode)) {
    return '意味がすぐ浮かぶかどうかで、わかる・わからないを選べます。'
  }

  return GROUP_DESCRIPTIONS[group]
}

function getStatusLabel(status: StudyStatus) {
  if (status === 2) return '習得済み'
  if (status === 1) return '要復習'
  return '未習得'
}

function buildGroupHref(group: QuizGroup, mode: WordQuizMode) {
  if (mode === 'all') return `/word-quiz/${group}`
  return `/word-quiz/${group}?mode=${mode}`
}

function shuffleItems<T>(items: T[]) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
  }

  return next
}

function hasSharedGenre(base: WordItem, target: WordItem) {
  return base.genres.some((genre) => target.genres.includes(genre))
}

const ALL_WORDS = GROUP_ORDER.flatMap((group) => WORD_GROUPS[group]).filter(
  (item) => item.word.trim() && item.meaning.trim()
)

function getWordPool(group: QuizGroup) {
  return getWordsByGroup(group).filter((item) => item.word.trim() && item.meaning.trim())
}

function getFrequentMistakePool(group: QuizGroup, allPool: WordItem[]) {
  const frequentMistakeWordIds = getFrequentMistakeWordIds(group)
  const orderMap = new Map(frequentMistakeWordIds.map((wordId, index) => [wordId, index]))

  return allPool
    .filter((item) => orderMap.has(item.id))
    .sort((left, right) => (orderMap.get(left.id) ?? 0) - (orderMap.get(right.id) ?? 0))
}

function resolveQuestionCount(group: QuizGroup, desiredCount: number) {
  const poolLength = getWordPool(group).length
  const minimumQuestionCount = Math.min(WORD_QUIZ_DEFAULT_QUESTION_COUNT, poolLength)

  return Math.max(minimumQuestionCount, Math.min(poolLength, desiredCount))
}

function collectDistractors(current: WordItem, primaryWords: WordItem[], fallbackWords: WordItem[]) {
  const selected: WordItem[] = []
  const usedMeanings = new Set([current.meaning])

  const candidateGroups = [
    primaryWords.filter(
      (item) =>
        item.id !== current.id &&
        item.partOfSpeech === current.partOfSpeech &&
        hasSharedGenre(current, item)
    ),
    primaryWords.filter(
      (item) => item.id !== current.id && item.partOfSpeech === current.partOfSpeech
    ),
    primaryWords.filter((item) => item.id !== current.id && hasSharedGenre(current, item)),
    primaryWords.filter((item) => item.id !== current.id),
    fallbackWords.filter(
      (item) =>
        item.id !== current.id &&
        item.partOfSpeech === current.partOfSpeech &&
        hasSharedGenre(current, item)
    ),
    fallbackWords.filter(
      (item) => item.id !== current.id && item.partOfSpeech === current.partOfSpeech
    ),
    fallbackWords.filter((item) => item.id !== current.id && hasSharedGenre(current, item)),
    fallbackWords.filter((item) => item.id !== current.id),
  ]

  candidateGroups.forEach((group) => {
    shuffleItems(group).forEach((candidate) => {
      if (selected.length >= 3) return
      if (usedMeanings.has(candidate.meaning)) return

      usedMeanings.add(candidate.meaning)
      selected.push(candidate)
    })
  })

  return selected.slice(0, 3)
}

function buildSessionPool(
  group: QuizGroup,
  desiredCount: number,
  mode: WordQuizMode,
  questionScope: WordQuizQuestionScope,
  mistakeWordIds: number[]
) {
  const allPool = getWordPool(group)
  const pool =
    mode === 'mistakes' || mode === 'check-mistakes'
      ? allPool.filter((item) => mistakeWordIds.includes(item.id))
      : questionScope === 'frequent-mistakes'
        ? getFrequentMistakePool(group, allPool)
        : allPool
  const questionCount =
    mode === 'mistakes' || mode === 'check-mistakes'
      ? pool.length
      : questionScope === 'frequent-mistakes'
        ? Math.min(pool.length, desiredCount)
        : resolveQuestionCount(group, desiredCount)
  const orderedPool =
    mode === 'mistakes' || mode === 'check-mistakes' || questionScope === 'all'
      ? shuffleItems(pool)
      : pool

  return orderedPool.slice(0, questionCount)
}

function createChoiceQuestionSet(
  group: QuizGroup,
  desiredCount: number,
  mode: 'all' | 'mistakes',
  questionScope: WordQuizQuestionScope,
  mistakeWordIds: number[]
): ChoiceEntry[] {
  const pool = buildSessionPool(group, desiredCount, mode, questionScope, mistakeWordIds)

  return pool.map((item) => {
    const distractors = collectDistractors(item, pool, ALL_WORDS)

    return {
      item,
      kind: 'choice',
      choices: shuffleItems([item.meaning, ...distractors.map((candidate) => candidate.meaning)]),
    }
  })
}

function createCheckSessionSet(
  group: QuizGroup,
  desiredCount: number,
  mode: 'check' | 'check-mistakes',
  questionScope: WordQuizQuestionScope,
  mistakeWordIds: number[]
): CheckEntry[] {
  return buildSessionPool(group, desiredCount, mode, questionScope, mistakeWordIds).map((item) => ({
    item,
    kind: 'check',
  }))
}

function buildSessionEntries(
  group: QuizGroup,
  desiredCount: number,
  mode: WordQuizMode,
  questionScope: WordQuizQuestionScope
): WordQuizEntry[] {
  if (isCheckMode(mode)) {
    return createCheckSessionSet(
      group,
      desiredCount,
      mode,
      questionScope,
      loadMistakeWordIds('word-quiz-check', group)
    )
  }

  return createChoiceQuestionSet(
    group,
    desiredCount,
    mode,
    questionScope,
    loadMistakeWordIds('word-quiz', group)
  )
}

export function WordQuizPlayer({
  group,
  initialMode = 'all',
}: {
  group: QuizGroup
  initialMode?: WordQuizMode
}) {
  const initialSettings = loadWordQuizSettings()
  const initialQuestionCount = resolveQuestionCount(group, initialSettings.questionCount)
  const [questionCount, setQuestionCount] = useState(initialQuestionCount)
  const [questionScope, setQuestionScope] = useState<WordQuizQuestionScope>(
    initialSettings.questionScope
  )
  const [hideChoicesInitially, setHideChoicesInitially] = useState(
    initialSettings.hideChoicesInitially
  )
  const [quizState, setQuizState] = useState(() => loadQuizState())
  const [sessionMode, setSessionMode] = useState<WordQuizMode>(initialMode)
  const [entries, setEntries] = useState<WordQuizEntry[]>(() =>
    buildSessionEntries(group, initialQuestionCount, initialMode, initialSettings.questionScope)
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [choicesVisible, setChoicesVisible] = useState(!initialSettings.hideChoicesInitially)
  const [results, setResults] = useState<WordQuizResult[]>([])
  const [checkAnswers, setCheckAnswers] = useState<CheckSessionAnswer[]>([])
  const [showHint, setShowHint] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [favoriteWordKeys, setFavoriteWordKeys] = useState(() => loadFavoriteWordKeys())

  const currentEntry = entries[currentIndex]
  const currentChoiceQuestion = currentEntry?.kind === 'choice' ? currentEntry : null
  const currentWord = currentEntry?.item
  const completed = currentIndex >= entries.length
  const correctCount = results.filter((result) => result.isCorrect).length
  const knownCount = checkAnswers.filter((answer) => answer.response === 'known').length
  const solvedCount = isCheckMode(sessionMode) ? checkAnswers.length : results.length
  const percent = entries.length === 0 ? 0 : Math.round((solvedCount / entries.length) * 100)
  const currentGroupIndex = GROUP_ORDER.indexOf(group)
  const previousGroup = GROUP_ORDER[(currentGroupIndex - 1 + GROUP_ORDER.length) % GROUP_ORDER.length]
  const nextGroup = GROUP_ORDER[(currentGroupIndex + 1) % GROUP_ORDER.length]
  const currentWordIsFavorite = currentWord
    ? favoriteWordKeys.includes(makeFavoriteWordKey(group, currentWord.id))
    : false

  useEffect(() => {
    if (!currentWord || completed) return

    const timer = window.setTimeout(() => {
      speakKorean(currentWord.word, { rate: 0.9 })
    }, 120)

    return () => {
      window.clearTimeout(timer)
      stopSpeaking()
    }
  }, [currentWord, completed])

  useEffect(() => {
    const savedSettings = loadWordQuizSettings()
    const nextCount = resolveQuestionCount(group, savedSettings.questionCount)

    setQuizState(loadQuizState())
    setQuestionCount(nextCount)
    setQuestionScope(savedSettings.questionScope)
    setHideChoicesInitially(savedSettings.hideChoicesInitially)
    setSessionMode(initialMode)
    setEntries(buildSessionEntries(group, nextCount, initialMode, savedSettings.questionScope))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setChoicesVisible(!savedSettings.hideChoicesInitially)
    setResults([])
    setCheckAnswers([])
    setShowHint(false)
    setShowDetail(false)
  }, [group, initialMode])

  const resetSession = () => {
    setQuizState(loadQuizState())
    setEntries(buildSessionEntries(group, questionCount, sessionMode, questionScope))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setChoicesVisible(!hideChoicesInitially)
    setResults([])
    setCheckAnswers([])
    setShowHint(false)
    setShowDetail(false)
  }

  const goNext = () => {
    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setChoicesVisible(!hideChoicesInitially)
    setShowHint(false)
    setShowDetail(false)
  }

  const handleChoiceAnswer = (choice: string) => {
    if (!currentChoiceQuestion || selectedAnswer) return

    const isCorrect = choice === currentChoiceQuestion.item.meaning
    const nextResults = [
      ...results,
      {
        question: currentChoiceQuestion,
        selectedAnswer: choice,
        correctAnswer: currentChoiceQuestion.item.meaning,
        isCorrect,
      },
    ]
    const mistakeWordIds = nextResults
      .filter((result) => !result.isCorrect)
      .map((result) => result.question.item.id)

    setSelectedAnswer(choice)
    setResults(nextResults)
    recordWordQuizAnswer(group, currentChoiceQuestion.item.id, isCorrect)
    saveMistakeWordIds('word-quiz', group, mistakeWordIds)
    playQuizSound(isCorrect ? 'correct' : 'incorrect')
  }

  const handleCheckAnswer = (response: CheckAnswerChoice) => {
    if (!currentWord || !isCheckMode(sessionMode)) return

    const responseIsKnown = response === 'known'
    const nextQuizState = responseIsKnown
      ? markKnown(quizState, group, currentWord.id)
      : markUnknown(quizState, group, currentWord.id)
    const nextAnswers = [...checkAnswers, { word: currentWord, response }]
    const mistakeWordIds = nextAnswers
      .filter((answer) => answer.response === 'unknown')
      .map((answer) => answer.word.id)

    setQuizState(nextQuizState)
    saveQuizState(nextQuizState)
    setCheckAnswers(nextAnswers)
    saveMistakeWordIds('word-quiz-check', group, mistakeWordIds)
    recordWordQuizAnswer(group, currentWord.id, responseIsKnown)
    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setChoicesVisible(!hideChoicesInitially)
    setShowHint(false)
    setShowDetail(false)
  }

  const retryChoiceMistakes = () => {
    const mistakeWordIds = results
      .filter((result) => !result.isCorrect)
      .map((result) => result.question.item.id)

    saveMistakeWordIds('word-quiz', group, mistakeWordIds)
    setSessionMode('mistakes')
    setEntries(createChoiceQuestionSet(group, questionCount, 'mistakes', questionScope, mistakeWordIds))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setChoicesVisible(!hideChoicesInitially)
    setResults([])
    setCheckAnswers([])
    setShowHint(false)
    setShowDetail(false)
  }

  const retryCheckMistakes = () => {
    const mistakeWordIds = checkAnswers
      .filter((answer) => answer.response === 'unknown')
      .map((answer) => answer.word.id)

    saveMistakeWordIds('word-quiz-check', group, mistakeWordIds)
    setSessionMode('check-mistakes')
    setEntries(
      createCheckSessionSet(group, questionCount, 'check-mistakes', questionScope, mistakeWordIds)
    )
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setChoicesVisible(!hideChoicesInitially)
    setResults([])
    setCheckAnswers([])
    setShowHint(false)
    setShowDetail(false)
  }

  const handleToggleFavorite = (wordId: number) => {
    const nextKeys = toggleFavoriteWordKey(favoriteWordKeys, group, wordId)
    setFavoriteWordKeys(nextKeys)
    saveFavoriteWordKeys(nextKeys)
  }

  if (entries.length === 0) {
    return (
      <main className={styles.page}>
        <section className={`${styles.card} ${styles.resultCard}`}>
          <h1 className={styles.resultTitle}>
            {sessionMode === 'mistakes'
              ? '4択で間違えた単語がまだありませんでした'
              : sessionMode === 'check-mistakes'
                ? 'わからない単語がまだありませんでした'
                : questionScope === 'frequent-mistakes'
                  ? '苦手単語がまだありません'
                  : '出題できる単語が見つかりませんでした'}
          </h1>
          <p className={styles.resultText}>
            {sessionMode === 'mistakes'
              ? 'まずは通常の4択クイズを進めて、あとで間違えた単語だけをまとめて復習してみてください。'
              : sessionMode === 'check-mistakes'
                ? 'まずはわかる / わからないモードを進めて、迷った単語がたまってきたらまとめて見直せます。'
                : questionScope === 'frequent-mistakes'
                  ? '通常出題で取り組んでいくと、苦手になりやすい単語だけをここから集中的に復習できます。'
                  : 'データを確認してから、別の難易度で試してください。'}
          </p>
          <div className={styles.resultActions}>
            {sessionMode === 'mistakes' && (
              <Link href={buildGroupHref(group, 'all')} className={`${styles.button} ${styles.primaryButton}`}>
                通常の4択を始める
              </Link>
            )}
            {sessionMode === 'check-mistakes' && (
              <Link
                href={buildGroupHref(group, 'check')}
                className={`${styles.button} ${styles.primaryButton}`}
              >
                わかる / わからないを始める
              </Link>
            )}
            {sessionMode !== 'mistakes' &&
              sessionMode !== 'check-mistakes' &&
              questionScope === 'frequent-mistakes' && (
              <Link
                href="/word-quiz/settings"
                className={`${styles.button} ${styles.primaryButton}`}
              >
                出題範囲を見直す
              </Link>
            )}
            <Link href="/word-quiz" className={`${styles.button} ${styles.secondaryButton}`}>
              難易度選択へ戻る
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (completed) {
    if (isCheckMode(sessionMode)) {
      const unknownCount = checkAnswers.length - knownCount

      return (
        <main className={styles.page}>
          <section className={`${styles.card} ${styles.resultCard}`}>
            <div className={styles.resultHeader}>
              <p className={styles.modePill}>
                {GROUP_LABELS[group]} {getModeLabel(sessionMode, questionScope)}
              </p>
              <h1 className={styles.resultTitle}>仕分けが完了しました</h1>
              <p className={styles.resultText}>
                {checkAnswers.length}語を、わかる / わからないで確認しました。
                {sessionMode === 'check-mistakes'
                  ? '迷いやすい単語だけをもう一度まとめて見直せます。'
                  : '一回わかるで要復習、二回わかるで習得済みとして保存されます。'}
              </p>
            </div>

            <div className={styles.summaryGrid}>
              <article className={`${styles.summaryCard} ${styles.summaryCorrect}`}>
                <span>わかる</span>
                <strong>{knownCount}語</strong>
              </article>

              <article className={`${styles.summaryCard} ${styles.summaryIncorrect}`}>
                <span>わからない</span>
                <strong>{unknownCount}語</strong>
              </article>
            </div>

            <div className={styles.resultActions}>
              <button
                type="button"
                onClick={resetSession}
                className={`${styles.button} ${styles.primaryButton}`}
              >
                もう一度
              </button>
              {unknownCount > 0 && (
                <button
                  type="button"
                  onClick={retryCheckMistakes}
                  className={`${styles.button} ${styles.secondaryButton}`}
                >
                  わからない単語だけ復習
                </button>
              )}
              <Link href="/word-quiz" className={`${styles.button} ${styles.secondaryButton}`}>
                難易度を選び直す
              </Link>
            </div>

            <ul className={styles.resultList}>
              {checkAnswers.map((answer, index) => (
                <li key={`${answer.word.id}-${index}`} className={styles.resultItem}>
                  <div className={styles.resultItemHeader}>
                    <span className={styles.resultIndex}>Q{index + 1}</span>
                    <span
                      className={`${styles.resultBadge} ${
                        answer.response === 'known'
                          ? styles.resultBadgeCorrect
                          : styles.resultBadgeIncorrect
                      }`}
                    >
                      {answer.response === 'known' ? 'わかる' : 'わからない'}
                    </span>
                  </div>

                  <strong className={styles.resultWord}>{answer.word.word}</strong>
                  <p className={styles.resultMeaning}>意味: {answer.word.meaning}</p>
                  <p className={styles.resultChoice}>
                    現在の状態: {getStatusLabel(getWordProgress(quizState, group, answer.word.id).status)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      )
    }

    return (
      <main className={styles.page}>
        <section className={`${styles.card} ${styles.resultCard}`}>
          <div className={styles.resultHeader}>
            <p className={styles.modePill}>
              {GROUP_LABELS[group]} {getModeLabel(sessionMode, questionScope)}
            </p>
            <h1 className={styles.resultTitle}>単語クイズが終了しました</h1>
            <p className={styles.resultText}>
              {GROUP_LABELS[group]}レベルを{entries.length}問テンポよく確認しました。
              {sessionMode === 'mistakes'
                ? '直近で間違えた単語をまとめて見直せます。'
                : questionScope === 'frequent-mistakes'
                  ? '苦手になりやすい単語をまとめて復習できました。'
                  : '間違えた問題もそのまま見直せます。'}
            </p>
          </div>

          <div className={styles.summaryGrid}>
            <article className={`${styles.summaryCard} ${styles.summaryCorrect}`}>
              <span>正解</span>
              <strong>{correctCount}問</strong>
            </article>

            <article className={`${styles.summaryCard} ${styles.summaryIncorrect}`}>
              <span>不正解</span>
              <strong>{results.length - correctCount}問</strong>
            </article>
          </div>

          <div className={styles.resultActions}>
            <button
              type="button"
              onClick={resetSession}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              もう一度
            </button>
            {results.length - correctCount > 0 && (
              <button
                type="button"
                onClick={retryChoiceMistakes}
                className={`${styles.button} ${styles.secondaryButton}`}
              >
                間違えた単語だけ復習
              </button>
            )}
            <Link href="/word-quiz" className={`${styles.button} ${styles.secondaryButton}`}>
              難易度を選び直す
            </Link>
          </div>

          <ul className={styles.resultList}>
            {results.map((result, index) => (
              <li key={`${result.question.item.id}-${index}`} className={styles.resultItem}>
                <div className={styles.resultItemHeader}>
                  <span className={styles.resultIndex}>Q{index + 1}</span>
                  <span
                    className={`${styles.resultBadge} ${
                      result.isCorrect ? styles.resultBadgeCorrect : styles.resultBadgeIncorrect
                    }`}
                  >
                    {result.isCorrect ? '正解' : '不正解'}
                  </span>
                </div>

                <strong className={styles.resultWord}>{result.question.item.word}</strong>
                <p className={styles.resultMeaning}>正解: {result.correctAnswer}</p>
                <p className={styles.resultChoice}>選択: {result.selectedAnswer}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    )
  }

  if (!currentWord) {
    return null
  }

  const isAnswered = selectedAnswer !== null
  const selectedIsCorrect = currentChoiceQuestion
    ? selectedAnswer === currentChoiceQuestion.item.meaning
    : false
  const currentStatus = getStatusLabel(getWordProgress(quizState, group, currentWord.id).status)

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.switcherBar}>
          <Link
            href={buildGroupHref(previousGroup, sessionMode)}
            className={styles.arrowButton}
            aria-label={`${GROUP_LABELS[previousGroup]}へ移動`}
          >
            ←
          </Link>

          <div className={styles.switcherCenter}>
            <p className={styles.switcherLabel}>Level Switch</p>
            <div className={styles.tabRow}>
              {GROUP_ORDER.map((item) => (
                <Link
                  key={item}
                  href={buildGroupHref(item, sessionMode)}
                  className={item === group ? styles.activeTab : styles.tab}
                >
                  {GROUP_LABELS[item]}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href={buildGroupHref(nextGroup, sessionMode)}
            className={styles.arrowButton}
            aria-label={`${GROUP_LABELS[nextGroup]}へ移動`}
          >
            →
          </Link>
        </div>

        <section className={styles.card}>
          <div className={styles.topRow}>
            <div>
              <p className={styles.modePill}>
                {GROUP_LABELS[group]} {getModeLabel(sessionMode, questionScope)}
              </p>
              <h1 className={styles.title}>{getModeTitle(group, sessionMode)}</h1>
              <p className={styles.subtitle}>{getModeDescription(group, sessionMode)}</p>
            </div>

            <div className={styles.progressBlock}>
              <Link href="/word-quiz/settings" className={styles.settingsLink}>
                出題設定
              </Link>
              <span className={styles.counter}>
                {currentIndex + 1} / {entries.length}
              </span>
              <div className={styles.progressTrack}>
                <span className={styles.progressFill} style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          <div className={styles.questionPanel}>
            <div className={styles.wordCard}>
              <div className={styles.wordCardHeader}>
                <span className={styles.wordLabel}>単語</span>
                <div className={styles.wordCardActions}>
                  <FavoriteButton
                    active={currentWordIsFavorite}
                    onClick={() => handleToggleFavorite(currentWord.id)}
                  />
                  <WordReportLink group={group} source="word-quiz" word={currentWord} />
                </div>
              </div>

              <strong className={styles.word}>{currentWord.word}</strong>

              {!isCheckMode(sessionMode) && (
                <>
                  <div className={styles.audioRow}>
                    <button
                      type="button"
                      className={styles.hintButton}
                      onClick={() => setShowHint((prev) => !prev)}
                    >
                      {showHint ? 'ヒントを閉じる' : 'ヒントを見る'}
                    </button>
                  </div>

                  {showHint && (
                    <div className={styles.hintPanel}>
                      <p className={styles.wordMeta}>
                        {currentWord.partOfSpeech}
                        {currentWord.genres.length > 0 ? ` / ${currentWord.genres.join('・')}` : ''}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className={styles.audioRow}>
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.listenButton}`}
                  onClick={() => speakKorean(currentWord.word, { rate: 0.9 })}
                >
                  音声をもう一度聞く
                </button>

                {!isCheckMode(sessionMode) && isAnswered && (
                  <button
                    type="button"
                    onClick={goNext}
                    className={`${styles.button} ${styles.primaryButton}`}
                  >
                    {currentIndex + 1 >= entries.length ? '結果を見る' : '次の問題へ'}
                  </button>
                )}
              </div>
            </div>

            {isCheckMode(sessionMode) ? (
              <>
                <div className={styles.checkActionRow}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.secondaryButton}`}
                    onClick={() => setShowDetail((prev) => !prev)}
                  >
                    {showDetail ? '解説を閉じる' : '解説を見る'}
                  </button>

                  <div className={styles.bottomButtons}>
                    <button
                      type="button"
                      className={styles.unknownButton}
                      onClick={() => handleCheckAnswer('unknown')}
                    >
                      わからない
                    </button>
                    <button
                      type="button"
                      className={styles.knownButton}
                      onClick={() => handleCheckAnswer('known')}
                    >
                      わかる
                    </button>
                  </div>
                </div>

                {showDetail && (
                  <div className={styles.detailBox}>
                    <h2 className={styles.detailTitle}>
                      {currentWord.word}
                      {currentWord.readingKatakana && (
                        <span className={styles.reading}>（{currentWord.readingKatakana}）</span>
                      )}
                    </h2>

                    {currentWord.highlightText && currentWord.highlightText !== currentWord.word && (
                      <p className={styles.detailLead}>
                        <strong>文中の形:</strong> {currentWord.highlightText}
                      </p>
                    )}

                    <div className={styles.detailGrid}>
                      <p><strong>意味:</strong> {currentWord.meaning}</p>
                      <p><strong>例文:</strong> {currentWord.example}</p>
                      <p><strong>例文訳:</strong> {currentWord.exampleTranslation}</p>
                      <p>
                        <strong>品詞 / ジャンル:</strong> {currentWord.partOfSpeech}
                        {currentWord.genres.length > 0 ? ` / ${currentWord.genres.join('・')}` : ''}
                      </p>
                      <p><strong>学習状態:</strong> {currentStatus}</p>
                    </div>

                    {currentWord.description && (
                      <p className={styles.infoBox}>
                        <strong>解説:</strong> {currentWord.description}
                      </p>
                    )}

                    {currentWord.usage && (
                      <p className={styles.infoBox}>
                        <strong>使い方:</strong> {currentWord.usage}
                      </p>
                    )}

                    {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                      <div className={styles.infoBox}>
                        <strong>類義語:</strong>
                        <ul className={styles.relatedList}>
                          {currentWord.synonyms.map((item, index) => (
                            <li key={`${item.word}-${index}`}>
                              {item.word}（{item.meaning}）
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentWord.antonyms && currentWord.antonyms.length > 0 && (
                      <div className={styles.infoBox}>
                        <strong>対義語:</strong>
                        <ul className={styles.relatedList}>
                          {currentWord.antonyms.map((item, index) => (
                            <li key={`${item.word}-${index}`}>
                              {item.word}（{item.meaning}）
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {!choicesVisible && !isAnswered ? (
                  <div className={styles.choiceHiddenPanel}>
                    <p className={styles.choiceHiddenText}>
                      選択肢はまだ隠れています。意味を思い出してから表示したいときに使えます。
                    </p>
                    <button
                      type="button"
                      onClick={() => setChoicesVisible(true)}
                      className={`${styles.button} ${styles.secondaryButton}`}
                    >
                      選択肢を表示
                    </button>
                  </div>
                ) : (
                  <div className={styles.choiceGrid}>
                    {currentChoiceQuestion?.choices.map((choice) => {
                      const isCorrectChoice = choice === currentChoiceQuestion.item.meaning
                      const isSelectedChoice = choice === selectedAnswer

                      let buttonClassName = styles.choiceButton

                      if (isAnswered && isCorrectChoice) {
                        buttonClassName = `${styles.choiceButton} ${styles.correctChoice}`
                      } else if (isAnswered && isSelectedChoice && !isCorrectChoice) {
                        buttonClassName = `${styles.choiceButton} ${styles.incorrectChoice}`
                      }

                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => handleChoiceAnswer(choice)}
                          disabled={isAnswered}
                          className={buttonClassName}
                        >
                          {choice}
                        </button>
                      )
                    })}
                  </div>
                )}

                {isAnswered && currentChoiceQuestion && (
                  <div className={styles.feedbackPanel}>
                    <p
                      className={`${styles.feedbackText} ${
                        selectedIsCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                      }`}
                    >
                      {selectedIsCorrect
                        ? '正解です。意味の対応がしっかり取れています。'
                        : '不正解です。正しい意味を確認して次へ進みましょう。'}
                    </p>

                    <div className={styles.exampleCard}>
                      <span className={styles.exampleLabel}>例文</span>
                      <p className={styles.example}>{currentChoiceQuestion.item.example}</p>
                      <p className={styles.translation}>
                        {currentChoiceQuestion.item.exampleTranslation}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
