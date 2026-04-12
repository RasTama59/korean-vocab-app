'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  GROUP_DESCRIPTIONS,
  GROUP_LABELS,
  GROUP_ORDER,
  WORD_GROUPS,
} from '@/data/word'
import { loadMistakeWordIds } from '@/lib/mistake-review-storage'
import type { QuizGroup } from '@/lib/quiz-types'
import styles from './word-quiz.module.css'

export default function WordQuizLevelPage() {
  const [mistakeCounts, setMistakeCounts] = useState<Record<QuizGroup, number>>({
    basic: 0,
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  })

  useEffect(() => {
    setMistakeCounts({
      basic: loadMistakeWordIds('word-quiz', 'basic').length,
      beginner: loadMistakeWordIds('word-quiz', 'beginner').length,
      intermediate: loadMistakeWordIds('word-quiz', 'intermediate').length,
      advanced: loadMistakeWordIds('word-quiz', 'advanced').length,
    })
  }, [])

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.badge}>Word Choice Quiz</p>
            <h1 className={styles.title}>単語クイズ</h1>
            <p className={styles.description}>
              表示された単語に合う意味を4択から選ぶ、軽めの確認モードです。
              品詞やジャンルが近い語彙も混ざるので、似た言葉の違いも見比べながら進められます。
            </p>
          </div>

          <div className={styles.noteCard}>
            <span>出題形式</span>
            <strong>4択で出題</strong>
            <p>問題数は単語クイズ全体で共通設定です。正解と不正解もその場で確認できます。</p>
            <Link href="/word-quiz/settings" className={styles.settingsLink}>
              問題数を設定する
            </Link>
          </div>
        </div>

        <div className={styles.grid}>
          {GROUP_ORDER.map((group) => (
            <article key={group} className={styles.levelCard}>
              <div className={styles.levelHeader}>
                <p className={styles.levelBadge}>{GROUP_LABELS[group]}</p>
                <span className={styles.levelCount}>{WORD_GROUPS[group].length}語</span>
              </div>

              <h2 className={styles.levelTitle}>{GROUP_LABELS[group]}レベル</h2>
              <p className={styles.levelText}>{GROUP_DESCRIPTIONS[group]}</p>

              <div className={styles.levelActions}>
                <Link href={`/word-quiz/${group}`} className={styles.levelAction}>
                  この難易度で始める
                </Link>
                {mistakeCounts[group] > 0 && (
                  <Link href={`/word-quiz/${group}?mode=mistakes`} className={styles.levelSettings}>
                    間違えた単語 {mistakeCounts[group]}問
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
