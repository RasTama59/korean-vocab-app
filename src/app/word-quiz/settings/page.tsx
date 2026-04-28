'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { GROUP_LABELS, GROUP_ORDER, WORD_GROUPS } from '@/data/word'
import {
  getFrequentMistakeCount,
  loadWordQuizSettings,
  saveWordQuizSettings,
  updateWordQuizSettings,
  WORD_QUIZ_DEFAULT_QUESTION_COUNT,
  WORD_QUIZ_FREQUENT_MISTAKE_MIN_WRONG_COUNT,
  WORD_QUIZ_QUESTION_STEP,
} from '@/lib/word-quiz-storage'
import type { QuizGroup } from '@/lib/quiz-types'
import styles from './settings.module.css'

const maxWordCount = Math.max(
  ...GROUP_ORDER.map((group) =>
    WORD_GROUPS[group].filter((item) => item.word.trim() && item.meaning.trim()).length
  )
)

const minWordCount = Math.min(
  ...GROUP_ORDER.map((group) =>
    WORD_GROUPS[group].filter((item) => item.word.trim() && item.meaning.trim()).length
  )
)

const minimumQuestionCount = Math.min(WORD_QUIZ_DEFAULT_QUESTION_COUNT, maxWordCount)

function clampQuestionCount(count: number) {
  return Math.max(minimumQuestionCount, Math.min(maxWordCount, count))
}

export default function WordQuizSettingsPage() {
  const [settings, setSettings] = useState(loadWordQuizSettings)
  const [frequentMistakeCounts, setFrequentMistakeCounts] = useState<Record<QuizGroup, number>>({
    basic: 0,
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  })
  const currentQuestionCount = clampQuestionCount(settings.questionCount)

  useEffect(() => {
    setFrequentMistakeCounts({
      basic: getFrequentMistakeCount('basic'),
      beginner: getFrequentMistakeCount('beginner'),
      intermediate: getFrequentMistakeCount('intermediate'),
      advanced: getFrequentMistakeCount('advanced'),
    })
  }, [])

  const levelSummaries = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        frequentMistakeCount: frequentMistakeCounts[group],
        group,
        count: WORD_GROUPS[group].filter((item) => item.word.trim() && item.meaning.trim()).length,
      })),
    [frequentMistakeCounts]
  )

  const changeCount = (delta: number) => {
    const nextQuestionCount = clampQuestionCount(currentQuestionCount + delta)
    const nextSettings = updateWordQuizSettings(settings, {
      questionCount: nextQuestionCount,
    })

    setSettings(nextSettings)
    saveWordQuizSettings(nextSettings)
  }

  const updateScope = (questionScope: 'all' | 'frequent-mistakes') => {
    const nextSettings = updateWordQuizSettings(settings, { questionScope })
    setSettings(nextSettings)
    saveWordQuizSettings(nextSettings)
  }

  const updateChoiceVisibility = (hideChoicesInitially: boolean) => {
    const nextSettings = updateWordQuizSettings(settings, { hideChoicesInitially })
    setSettings(nextSettings)
    saveWordQuizSettings(nextSettings)
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/word-quiz" className={styles.backLink}>
          単語クイズ一覧へ戻る
        </Link>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Word Quiz Settings</p>
          <h1 className={styles.title}>単語クイズの出題設定</h1>
          <p className={styles.description}>
            この設定は難易度ごとではなく、単語クイズ全体で共通です。
            問題数、出題範囲、選択肢の見せ方をまとめて調整できます。
          </p>
        </div>

        <div className={styles.summaryRow}>
          <article className={styles.summaryCard}>
            <span>現在の共通問題数</span>
            <strong>{currentQuestionCount}問</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>もっとも少ないレベル</span>
            <strong>{minWordCount}語</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>現在の出題範囲</span>
            <strong>{settings.questionScope === 'all' ? '全問' : '苦手単語'}</strong>
          </article>
        </div>

        <div className={styles.countBox}>
          <div>
            <div className={styles.countLabel}>1回の単語クイズ問題数</div>
            <div className={styles.countHelp}>
              10問単位で変更できます。最大は{maxWordCount}問まで設定できます。
            </div>
          </div>

          <div className={styles.countRow}>
            <button
              type="button"
              onClick={() => changeCount(-WORD_QUIZ_QUESTION_STEP)}
              className={styles.countButton}
            >
              −
            </button>
            <span className={styles.countNumber}>{currentQuestionCount}問</span>
            <button
              type="button"
              onClick={() => changeCount(WORD_QUIZ_QUESTION_STEP)}
              className={styles.countButton}
            >
              ＋
            </button>
          </div>
        </div>

        <section className={styles.optionSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>出題範囲</div>
            <p className={styles.sectionHelp}>
              普段どおり全問から出すか、単語クイズで不正解が多い単語だけに絞るかを選べます。
            </p>
          </div>

          <div className={styles.optionGrid}>
            <button
              type="button"
              onClick={() => updateScope('all')}
              className={`${styles.optionCard} ${
                settings.questionScope === 'all' ? styles.optionCardActive : ''
              }`}
            >
              <span className={styles.optionLabel}>全問から出題</span>
              <strong className={styles.optionValue}>通常モード</strong>
              <p className={styles.optionText}>今のレベルの単語全体から、設定問題数ぶん出題します。</p>
            </button>

            <button
              type="button"
              onClick={() => updateScope('frequent-mistakes')}
              className={`${styles.optionCard} ${
                settings.questionScope === 'frequent-mistakes' ? styles.optionCardActive : ''
              }`}
            >
              <span className={styles.optionLabel}>間違えが多い単語</span>
              <strong className={styles.optionValue}>苦手復習モード</strong>
              <p className={styles.optionText}>
                {WORD_QUIZ_FREQUENT_MISTAKE_MIN_WRONG_COUNT}回以上不正解になった単語を優先して復習します。
              </p>
            </button>
          </div>
        </section>

        <section className={styles.optionSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>選択肢の表示</div>
            <p className={styles.sectionHelp}>
              最初から4択を見せるか、まず自分で意味を思い浮かべてから表示するかを選べます。
            </p>
          </div>

          <div className={styles.optionGrid}>
            <button
              type="button"
              onClick={() => updateChoiceVisibility(false)}
              className={`${styles.optionCard} ${
                !settings.hideChoicesInitially ? styles.optionCardActive : ''
              }`}
            >
              <span className={styles.optionLabel}>最初から表示</span>
              <strong className={styles.optionValue}>すぐに4択を見る</strong>
              <p className={styles.optionText}>今までどおり、問題が出たらそのまま選択肢も表示します。</p>
            </button>

            <button
              type="button"
              onClick={() => updateChoiceVisibility(true)}
              className={`${styles.optionCard} ${
                settings.hideChoicesInitially ? styles.optionCardActive : ''
              }`}
            >
              <span className={styles.optionLabel}>はじめは隠す</span>
              <strong className={styles.optionValue}>思い出してから表示</strong>
              <p className={styles.optionText}>「選択肢を表示」ボタンを押すまで、4択を隠して出題します。</p>
            </button>
          </div>
        </section>

        <div className={styles.levelGrid}>
          {levelSummaries.map(({ group, count, frequentMistakeCount }) => (
            <article key={group} className={styles.levelCard}>
              <span>{GROUP_LABELS[group]}</span>
              <strong>{count}語</strong>
              <p className={styles.levelHint}>苦手候補 {frequentMistakeCount}語</p>
            </article>
          ))}
        </div>

        <div className={styles.actionRow}>
          <Link href="/word-quiz" className={styles.primaryLink}>
            この設定で始める
          </Link>
        </div>
      </section>
    </main>
  )
}
