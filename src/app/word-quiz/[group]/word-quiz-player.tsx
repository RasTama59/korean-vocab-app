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
import type { QuizGroup, WordItem } from '@/lib/quiz-types'
import {
  getFrequentMistakeWordIds,
  loadWordQuizSettings,
  recordWordQuizAnswer,
  WORD_QUIZ_DEFAULT_QUESTION_COUNT,
  type WordQuizQuestionScope,
} from '@/lib/word-quiz-storage'
import styles from './word-quiz-player.module.css'

type WordQuizQuestion = {
  choices: string[]
  item: WordItem
}

type WordQuizResult = {
  correctAnswer: string
  isCorrect: boolean
  question: WordQuizQuestion
  selectedAnswer: string
}

type WordQuizMode = 'all' | 'mistakes'

function getModeLabel(mode: WordQuizMode, questionScope: WordQuizQuestionScope) {
  if (mode === 'mistakes') return '直近ミス復習'
  if (questionScope === 'frequent-mistakes') return '苦手復習'
  return '単語クイズ'
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

function createQuestionSet(
  group: QuizGroup,
  desiredCount: number,
  mode: WordQuizMode,
  questionScope: WordQuizQuestionScope,
  mistakeWordIds: number[]
) {
  const allPool = getWordPool(group)
  const pool =
    mode === 'mistakes'
      ? allPool.filter((item) => mistakeWordIds.includes(item.id))
      : questionScope === 'frequent-mistakes'
        ? getFrequentMistakePool(group, allPool)
        : allPool
  const questionCount =
    mode === 'mistakes'
      ? pool.length
      : questionScope === 'frequent-mistakes'
        ? Math.min(pool.length, desiredCount)
        : resolveQuestionCount(group, desiredCount)
  const orderedPool =
    mode === 'mistakes' || questionScope === 'all' ? shuffleItems(pool) : pool

  return orderedPool
    .slice(0, questionCount)
    .map((item) => {
      const distractors = collectDistractors(item, pool, ALL_WORDS)

      return {
        item,
        choices: shuffleItems([item.meaning, ...distractors.map((candidate) => candidate.meaning)]),
      }
    })
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
  const [sessionMode, setSessionMode] = useState<WordQuizMode>(initialMode)
  const [questions, setQuestions] = useState(() => {
    const mistakeWordIds = loadMistakeWordIds('word-quiz', group)
    return createQuestionSet(
      group,
      initialQuestionCount,
      initialMode,
      initialSettings.questionScope,
      mistakeWordIds
    )
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [choicesVisible, setChoicesVisible] = useState(!initialSettings.hideChoicesInitially)
  const [results, setResults] = useState<WordQuizResult[]>([])
  const [showHint, setShowHint] = useState(false)
  const [favoriteWordKeys, setFavoriteWordKeys] = useState(() => loadFavoriteWordKeys())

  const currentQuestion = questions[currentIndex]
  const completed = currentIndex >= questions.length
  const correctCount = results.filter((result) => result.isCorrect).length
  const percent = questions.length === 0 ? 0 : Math.round((results.length / questions.length) * 100)
  const currentGroupIndex = GROUP_ORDER.indexOf(group)
  const previousGroup = GROUP_ORDER[(currentGroupIndex - 1 + GROUP_ORDER.length) % GROUP_ORDER.length]
  const nextGroup = GROUP_ORDER[(currentGroupIndex + 1) % GROUP_ORDER.length]
  const currentWordIsFavorite = currentQuestion
    ? favoriteWordKeys.includes(makeFavoriteWordKey(group, currentQuestion.item.id))
    : false

  useEffect(() => {
    if (!currentQuestion || completed) return

    const timer = window.setTimeout(() => {
      speakKorean(currentQuestion.item.word, { rate: 0.9 })
    }, 120)

    return () => {
      window.clearTimeout(timer)
      stopSpeaking()
    }
  }, [currentQuestion, completed])

  useEffect(() => {
    const savedSettings = loadWordQuizSettings()
    const nextCount = resolveQuestionCount(group, savedSettings.questionCount)
    const mistakeWordIds = loadMistakeWordIds('word-quiz', group)

    setQuestionCount(nextCount)
    setQuestionScope(savedSettings.questionScope)
    setHideChoicesInitially(savedSettings.hideChoicesInitially)
    setSessionMode(initialMode)
    setQuestions(
      createQuestionSet(
        group,
        nextCount,
        initialMode,
        savedSettings.questionScope,
        mistakeWordIds
      )
    )
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setChoicesVisible(!savedSettings.hideChoicesInitially)
    setResults([])
    setShowHint(false)
  }, [group, initialMode])

  const resetSession = () => {
    const mistakeWordIds = loadMistakeWordIds('word-quiz', group)
    setQuestions(createQuestionSet(group, questionCount, sessionMode, questionScope, mistakeWordIds))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setChoicesVisible(!hideChoicesInitially)
    setResults([])
    setShowHint(false)
  }

  const goNext = () => {
    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setChoicesVisible(!hideChoicesInitially)
    setShowHint(false)
  }

  const handleAnswer = (choice: string) => {
    if (!currentQuestion || selectedAnswer) return

    const isCorrect = choice === currentQuestion.item.meaning
    const nextResults = [
      ...results,
      {
        question: currentQuestion,
        selectedAnswer: choice,
        correctAnswer: currentQuestion.item.meaning,
        isCorrect,
      },
    ]
    const mistakeWordIds = nextResults
      .filter((result) => !result.isCorrect)
      .map((result) => result.question.item.id)

    setSelectedAnswer(choice)
    setResults(nextResults)
    recordWordQuizAnswer(group, currentQuestion.item.id, isCorrect)
    saveMistakeWordIds('word-quiz', group, mistakeWordIds)
    playQuizSound(isCorrect ? 'correct' : 'incorrect')
  }

  const retryMistakes = () => {
    const mistakeWordIds = results
      .filter((result) => !result.isCorrect)
      .map((result) => result.question.item.id)

    saveMistakeWordIds('word-quiz', group, mistakeWordIds)
    setSessionMode('mistakes')
    setQuestions(createQuestionSet(group, questionCount, 'mistakes', questionScope, mistakeWordIds))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setChoicesVisible(!hideChoicesInitially)
    setResults([])
    setShowHint(false)
  }

  const handleToggleFavorite = (wordId: number) => {
    const nextKeys = toggleFavoriteWordKey(favoriteWordKeys, group, wordId)
    setFavoriteWordKeys(nextKeys)
    saveFavoriteWordKeys(nextKeys)
  }

  if (questions.length === 0) {
    return (
      <main className={styles.page}>
        <section className={`${styles.card} ${styles.resultCard}`}>
          <h1 className={styles.resultTitle}>
            {sessionMode === 'mistakes'
              ? '間違えた単語がまだありませんでした'
              : questionScope === 'frequent-mistakes'
                ? '苦手単語がまだありません'
                : '出題できる単語が見つかりませんでした'}
          </h1>
          <p className={styles.resultText}>
            {sessionMode === 'mistakes'
              ? 'まずは通常の単語クイズを進めて、あとで間違えた単語だけをまとめて復習してみてください。'
              : questionScope === 'frequent-mistakes'
                ? 'まずは通常の単語クイズで解いてみて、苦手な単語がたまってきたらこの範囲でまとめて復習できます。'
                : 'データを確認してから、別の難易度で試してください。'}
          </p>
          <div className={styles.resultActions}>
            {sessionMode === 'mistakes' && (
              <Link href={`/word-quiz/${group}`} className={`${styles.button} ${styles.primaryButton}`}>
                通常クイズを始める
              </Link>
            )}
            {sessionMode !== 'mistakes' && questionScope === 'frequent-mistakes' && (
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
    return (
      <main className={styles.page}>
        <section className={`${styles.card} ${styles.resultCard}`}>
          <div className={styles.resultHeader}>
            <p className={styles.modePill}>
              {GROUP_LABELS[group]} {getModeLabel(sessionMode, questionScope)}
            </p>
            <h1 className={styles.resultTitle}>単語クイズが終了しました</h1>
            <p className={styles.resultText}>
              {GROUP_LABELS[group]}レベルを{questions.length}問テンポよく確認しました。
              {sessionMode === 'mistakes'
                ? '直近で間違えた単語をまとめて見直せます。'
                : questionScope === 'frequent-mistakes'
                  ? '不正解が多かった単語をまとめて復習できました。'
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
                onClick={retryMistakes}
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

  const isAnswered = selectedAnswer !== null
  const selectedIsCorrect = selectedAnswer === currentQuestion.item.meaning

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.switcherBar}>
          <Link
            href={`/word-quiz/${previousGroup}`}
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
                  href={`/word-quiz/${item}`}
                  className={item === group ? styles.activeTab : styles.tab}
                >
                  {GROUP_LABELS[item]}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href={`/word-quiz/${nextGroup}`}
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
              <h1 className={styles.title}>{GROUP_LABELS[group]}レベルの意味を選ぶ</h1>
              <p className={styles.subtitle}>{GROUP_DESCRIPTIONS[group]}</p>
            </div>

            <div className={styles.progressBlock}>
              <Link href="/word-quiz/settings" className={styles.settingsLink}>
                出題設定
              </Link>
              <span className={styles.counter}>
                {currentIndex + 1} / {questions.length}
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
                    onClick={() => handleToggleFavorite(currentQuestion.item.id)}
                  />
                  <WordReportLink group={group} source="word-quiz" word={currentQuestion.item} />
                </div>
              </div>

              <strong className={styles.word}>{currentQuestion.item.word}</strong>

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
                    {currentQuestion.item.partOfSpeech}
                    {currentQuestion.item.genres.length > 0
                      ? ` / ${currentQuestion.item.genres.join('・')}`
                      : ''}
                  </p>
                </div>
              )}

              <div className={styles.audioRow}>
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.listenButton}`}
                  onClick={() => speakKorean(currentQuestion.item.word, { rate: 0.9 })}
                >
                  音声をもう一度聞く
                </button>

                {isAnswered && (
                  <button
                    type="button"
                    onClick={goNext}
                    className={`${styles.button} ${styles.primaryButton}`}
                  >
                    {currentIndex + 1 >= questions.length ? '結果を見る' : '次の問題へ'}
                  </button>
                )}
              </div>
            </div>

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
                {currentQuestion.choices.map((choice) => {
                  const isCorrectChoice = choice === currentQuestion.item.meaning
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
                      onClick={() => handleAnswer(choice)}
                      disabled={isAnswered}
                      className={buttonClassName}
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>
            )}

            {isAnswered && (
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
                  <p className={styles.example}>{currentQuestion.item.example}</p>
                  <p className={styles.translation}>{currentQuestion.item.exampleTranslation}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
