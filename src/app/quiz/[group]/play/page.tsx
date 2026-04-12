'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { FavoriteButton } from '@/components/favorite-button'
import { WordReportLink } from '@/components/word-report-link'
import { GROUP_LABELS, getWordsByGroup } from '@/data/word'
import { renderHighlightedSentence } from '@/lib/example-highlight'
import {
  loadFavoriteWordKeys,
  makeFavoriteWordKey,
  saveFavoriteWordKeys,
  toggleFavoriteWordKey,
} from '@/lib/favorite-words'
import { loadMistakeWordIds, saveMistakeWordIds } from '@/lib/mistake-review-storage'
import { speakKorean, stopSpeaking } from '@/lib/quiz-tts'
import { QuizGroup, QuizState, WordItem } from '@/lib/quiz-types'
import {
  getWordProgress,
  loadQuizState,
  markKnown,
  markUnknown,
  saveQuizState,
  shuffleArray,
} from '@/lib/quiz-storage'
import styles from './play.module.css'

type QuizMode = 'random' | 'review' | 'mistakes'
type AnswerChoice = 'known' | 'unknown'
type SessionAnswer = {
  word: WordItem
  response: AnswerChoice
}

function getQuizModeLabel(mode: QuizMode) {
  if (mode === 'review') return '復習'
  if (mode === 'mistakes') return '間違い復習'
  return 'ランダム'
}

function buildSessionWords(
  allWords: WordItem[],
  group: QuizGroup,
  mode: QuizMode,
  state: QuizState,
  mistakeWordIds: number[]
) {
  const pool =
    mode === 'random'
      ? shuffleArray(allWords)
      : mode === 'mistakes'
        ? shuffleArray(allWords.filter((word) => mistakeWordIds.includes(word.id)))
        : shuffleArray(
          allWords.filter((word) => {
            const status = getWordProgress(state, group, word.id).status
            return state[group].settings.reviewTargets.includes(status)
          })
        )

  const questionCount =
    mode === 'mistakes'
      ? pool.length
      : Math.min(state[group].settings.questionCount, pool.length)
  return pool.slice(0, questionCount)
}

export default function QuizPlayPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const group = params.group as QuizGroup
  const initialMode = (searchParams.get('mode') as QuizMode) || 'random'

  const allWords = useMemo(() => getWordsByGroup(group), [group])
  const initialState = useMemo(() => loadQuizState(), [])
  const initialMistakeWordIds = useMemo(() => loadMistakeWordIds('example-quiz', group), [group])
  const [state, setState] = useState(initialState)
  const [sessionMode, setSessionMode] = useState<QuizMode>(initialMode)
  const [sessionWords, setSessionWords] = useState<WordItem[]>(() =>
    buildSessionWords(allWords, group, initialMode, initialState, initialMistakeWordIds)
  )
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [showDetail, setShowDetail] = useState(false)
  const [favoriteWordKeys, setFavoriteWordKeys] = useState(() => loadFavoriteWordKeys())

  const favoriteKeySet = new Set(favoriteWordKeys)

  const currentIndex = answers.length
  const word = sessionWords[currentIndex]
  const isComplete = sessionWords.length > 0 && currentIndex >= sessionWords.length
  const currentWordIsFavorite = word
    ? favoriteKeySet.has(makeFavoriteWordKey(group, word.id))
    : false

  useEffect(() => {
    const latestState = loadQuizState()
    const latestMistakeWordIds = loadMistakeWordIds('example-quiz', group)

    setState(latestState)
    setSessionMode(initialMode)
    setSessionWords(
      buildSessionWords(allWords, group, initialMode, latestState, latestMistakeWordIds)
    )
    setAnswers([])
    setShowDetail(false)
  }, [allWords, group, initialMode])

  useEffect(() => {
    if (!word || isComplete) return

    const timer = window.setTimeout(() => {
      speakKorean(word.example, { rate: 0.95 })
    }, 120)

    return () => {
      window.clearTimeout(timer)
      stopSpeaking()
    }
  }, [word, isComplete])

  const handleAnswer = (response: AnswerChoice) => {
    if (!word) return

    const nextState =
      response === 'known' ? markKnown(state, group, word.id) : markUnknown(state, group, word.id)
    const nextAnswers = [...answers, { word, response }]
    const mistakeWordIds = nextAnswers
      .filter((answer) => answer.response === 'unknown')
      .map((answer) => answer.word.id)

    setState(nextState)
    saveQuizState(nextState)
    setAnswers(nextAnswers)
    saveMistakeWordIds('example-quiz', group, mistakeWordIds)
    setShowDetail(false)
  }

  const restartSession = () => {
    const latestState = loadQuizState()
    const latestMistakeWordIds = loadMistakeWordIds('example-quiz', group)

    setState(latestState)
    setSessionWords(
      buildSessionWords(allWords, group, sessionMode, latestState, latestMistakeWordIds)
    )
    setAnswers([])
    setShowDetail(false)
  }

  const startMistakeReview = () => {
    const mistakeWords = shuffleArray(
      answers.filter((answer) => answer.response === 'unknown').map((answer) => answer.word)
    )

    saveMistakeWordIds(
      'example-quiz',
      group,
      mistakeWords.map((item) => item.id)
    )
    setSessionMode('mistakes')
    setSessionWords(mistakeWords)
    setAnswers([])
    setShowDetail(false)
  }

  const handleToggleFavorite = (wordId: number) => {
    const nextKeys = toggleFavoriteWordKey(favoriteWordKeys, group, wordId)
    setFavoriteWordKeys(nextKeys)
    saveFavoriteWordKeys(nextKeys)
  }

  if (sessionWords.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.quizCard}>
          <h1 className={styles.emptyTitle}>
            {sessionMode === 'mistakes' ? '間違えた単語がまだありません' : '出題できる問題がありません'}
          </h1>
          <p className={styles.emptyText}>
            {sessionMode === 'mistakes'
              ? 'まずは通常のクイズを進めて、あとで間違えた単語だけを復習してみてください。'
              : '復習条件か問題数を見直してください。'}
          </p>
          <div className={styles.emptyActions}>
            {sessionMode === 'mistakes' ? (
              <Link
                href={`/quiz/${group}/play?mode=random`}
                className={`${styles.button} ${styles.primaryLinkButton}`}
              >
                通常クイズを始める
              </Link>
            ) : (
              <Link
                href={`/quiz/${group}/settings`}
                className={`${styles.button} ${styles.primaryLinkButton}`}
              >
                復習設定を開く
              </Link>
            )}
            <Link
              href={`/quiz/${group}`}
              className={`${styles.button} ${styles.secondaryLinkButton}`}
            >
              クイズページへ戻る
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (isComplete) {
    const knownCount = answers.filter((answer) => answer.response === 'known').length
    const unknownCount = answers.length - knownCount

    return (
      <main className={styles.page}>
        <div className={`${styles.quizCard} ${styles.resultCard}`}>
          <div className={styles.resultHeader}>
            <p className={styles.modePill}>
              {GROUP_LABELS[group]} {getQuizModeLabel(sessionMode)}モード
            </p>
            <h1 className={styles.resultTitle}>今回のリザルト</h1>
            <p className={styles.resultText}>
              {answers.length}問の回答結果を一覧で確認できます。
            </p>
          </div>

          <div className={styles.resultSummary}>
            <div className={`${styles.summaryCard} ${styles.summaryKnown}`}>
              <span>わかる</span>
              <strong>{knownCount}問</strong>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryUnknown}`}>
              <span>わからない</span>
              <strong>{unknownCount}問</strong>
            </div>
          </div>

          <div className={styles.resultActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={restartSession}
            >
              もう一度
            </button>
            {unknownCount > 0 && (
              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={startMistakeReview}
              >
                間違えた単語だけ復習
              </button>
            )}
            <Link
              href={`/quiz/${group}`}
              className={`${styles.button} ${styles.secondaryLinkButton}`}
            >
              クイズページへ戻る
            </Link>
          </div>

          <ol className={styles.resultList}>
            {answers.map((answer, index) => (
              <li key={`${answer.word.id}-${index}`} className={styles.resultItem}>
                <div className={styles.resultItemHeader}>
                  <span className={styles.resultIndex}>Q{index + 1}</span>
                  <span
                    className={
                      answer.response === 'known'
                        ? `${styles.resultBadge} ${styles.resultBadgeKnown}`
                        : `${styles.resultBadge} ${styles.resultBadgeUnknown}`
                    }
                  >
                    {answer.response === 'known' ? 'わかる' : 'わからない'}
                  </span>
                </div>

                <p className={styles.resultExample}>
                  {renderHighlightedSentence(answer.word.example, [
                    answer.word.highlightText,
                    answer.word.word,
                    answer.word.baseForm,
                  ], styles.highlight)}
                </p>

                <div className={styles.resultMeta}>
                  <strong>{answer.word.word}</strong>
                  <span>{answer.word.meaning}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </main>
    )
  }

  const solvedPercent =
    sessionWords.length === 0 ? 0 : Math.round((currentIndex / sessionWords.length) * 100)

  return (
    <main className={styles.page}>
      <div className={styles.quizCard}>
        <div className={styles.topRow}>
          <div>
            <span className={styles.modePill}>
              {GROUP_LABELS[group]} {getQuizModeLabel(sessionMode)}
            </span>
            <div className={styles.counter}>
              {currentIndex + 1} / {sessionWords.length}
            </div>
          </div>

          <div className={styles.progressBlock}>
            <span className={styles.progress}>{solvedPercent}%</span>
            <div className={styles.progressTrack}>
              <span className={styles.progressFill} style={{ width: `${solvedPercent}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.questionArea}>
          <p className={styles.example}>
            {renderHighlightedSentence(word.example, [
              word.highlightText,
              word.word,
              word.baseForm,
            ], styles.highlight)}
          </p>

          <button
            type="button"
            className={`${styles.iconButton} ${styles.listenButton}`}
            onClick={() => speakKorean(word.example, { rate: 0.95 })}
          >
            読み上げ
          </button>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => setShowDetail(!showDetail)}
          >
            {showDetail ? '解説を閉じる' : '解説を見る'}
          </button>

          <div className={styles.bottomButtons}>
            <button
              type="button"
              className={styles.unknownButton}
              onClick={() => handleAnswer('unknown')}
            >
              わからない
            </button>
            <button
              type="button"
              className={styles.knownButton}
              onClick={() => handleAnswer('known')}
            >
              わかる
            </button>
          </div>
        </div>

        {showDetail && (
          <div className={styles.detailBox}>
            <div className={styles.detailHeader}>
              <h2 className={styles.detailTitle}>
                {word.word}
                {word.readingKatakana && (
                  <span className={styles.reading}>（{word.readingKatakana}）</span>
                )}
              </h2>

              <div className={styles.detailActions}>
                <FavoriteButton
                  active={currentWordIsFavorite}
                  onClick={() => handleToggleFavorite(word.id)}
                />
                <WordReportLink group={group} source="example-quiz" word={word} />
              </div>
            </div>

            {word.highlightText && word.highlightText !== word.word && (
              <p>
                <strong>文中の形:</strong> {word.highlightText}
              </p>
            )}

            <div className={styles.detailGrid}>
              <p><strong>意味:</strong> {word.meaning}</p>
              <p><strong>例文訳:</strong> {word.exampleTranslation}</p>
              <p><strong>ジャンル:</strong> {word.genres.join(' / ')}</p>
            </div>

            {word.description && (
              <p className={styles.infoBox}>
                <strong>解説:</strong> {word.description}
              </p>
            )}

            {word.usage && (
              <p className={styles.infoBox}>
                <strong>使い方:</strong> {word.usage}
              </p>
            )}

            {word.synonyms && word.synonyms.length > 0 && (
              <div className={styles.infoBox}>
                <strong>類義語:</strong>
                <ul className={styles.relatedList}>
                  {word.synonyms.map((item, index) => (
                    <li key={`${item.word}-${index}`}>
                      {item.word}（{item.meaning}）
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {word.antonyms && word.antonyms.length > 0 && (
              <div className={styles.infoBox}>
                <strong>対義語:</strong>
                <ul className={styles.relatedList}>
                  {word.antonyms.map((item, index) => (
                    <li key={`${item.word}-${index}`}>
                      {item.word}（{item.meaning}）
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
