'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { GROUP_LABELS, GROUP_ORDER, WORD_GROUPS } from '@/data/word'
import {
  loadWordQuizSettings,
  saveWordQuizSettings,
  updateWordQuizSettings,
  WORD_QUIZ_DEFAULT_QUESTION_COUNT,
  WORD_QUIZ_QUESTION_STEP,
} from '@/lib/word-quiz-storage'
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
  const currentQuestionCount = clampQuestionCount(settings.questionCount)

  const levelSummaries = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        count: WORD_GROUPS[group].filter((item) => item.word.trim() && item.meaning.trim()).length,
      })),
    []
  )

  const changeCount = (delta: number) => {
    const nextQuestionCount = clampQuestionCount(currentQuestionCount + delta)
    const nextSettings = updateWordQuizSettings(settings, {
      questionCount: nextQuestionCount,
    })

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
          <h1 className={styles.title}>単語クイズの問題数設定</h1>
          <p className={styles.description}>
            この設定は難易度ごとではなく、単語クイズ全体で共通です。
            各レベルの総単語数を超える場合は、その範囲内に自動で調整されます。
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

        <div className={styles.levelGrid}>
          {levelSummaries.map(({ group, count }) => (
            <article key={group} className={styles.levelCard}>
              <span>{GROUP_LABELS[group]}</span>
              <strong>{count}語</strong>
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
