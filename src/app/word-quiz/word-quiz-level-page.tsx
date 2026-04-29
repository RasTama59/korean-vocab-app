'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  GROUP_DESCRIPTIONS,
  GROUP_LABELS,
  GROUP_ORDER,
  WORD_GROUPS,
} from '@/data/word'
import { loadMistakeWordIds } from '@/lib/mistake-review-storage'
import type { QuizGroup } from '@/lib/quiz-types'
import { getCounts, loadQuizState } from '@/lib/quiz-storage'
import styles from './word-quiz.module.css'

export function WordQuizLevelClientPage() {
  const [quizState, setQuizState] = useState(() => loadQuizState())
  const [choiceMistakeCounts, setChoiceMistakeCounts] = useState<Record<QuizGroup, number>>({
    basic: 0,
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  })
  const [checkMistakeCounts, setCheckMistakeCounts] = useState<Record<QuizGroup, number>>({
    basic: 0,
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  })

  useEffect(() => {
    setQuizState(loadQuizState())
    setChoiceMistakeCounts({
      basic: loadMistakeWordIds('word-quiz', 'basic').length,
      beginner: loadMistakeWordIds('word-quiz', 'beginner').length,
      intermediate: loadMistakeWordIds('word-quiz', 'intermediate').length,
      advanced: loadMistakeWordIds('word-quiz', 'advanced').length,
    })
    setCheckMistakeCounts({
      basic: loadMistakeWordIds('word-quiz-check', 'basic').length,
      beginner: loadMistakeWordIds('word-quiz-check', 'beginner').length,
      intermediate: loadMistakeWordIds('word-quiz-check', 'intermediate').length,
      advanced: loadMistakeWordIds('word-quiz-check', 'advanced').length,
    })
  }, [])

  const levelProgress = useMemo(
    () =>
      GROUP_ORDER.reduce<
        Record<
          QuizGroup,
          {
            mastered: number
            percent: number
            review: number
            total: number
            unlearned: number
          }
        >
      >((accumulator, group) => {
        const wordIds = WORD_GROUPS[group]
          .filter((item) => item.word.trim() && item.meaning.trim())
          .map((item) => item.id)
        const counts = getCounts(quizState, group, wordIds)
        const total = wordIds.length

        accumulator[group] = {
          ...counts,
          total,
          percent: total === 0 ? 0 : Math.round((counts.mastered / total) * 100),
        }

        return accumulator
      }, {
        basic: { mastered: 0, percent: 0, review: 0, total: 0, unlearned: 0 },
        beginner: { mastered: 0, percent: 0, review: 0, total: 0, unlearned: 0 },
        intermediate: { mastered: 0, percent: 0, review: 0, total: 0, unlearned: 0 },
        advanced: { mastered: 0, percent: 0, review: 0, total: 0, unlearned: 0 },
      }),
    [quizState]
  )

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.badge}>Word Quiz Modes</p>
            <h1 className={styles.title}>単語クイズ</h1>
            <p className={styles.description}>
              4択で意味を選ぶモードと、単語を見て「わかる / わからない」で仕分けるモードを、
              同じレベル画面から切り替えて使えます。気軽な確認と定着チェックを、
              その日の気分に合わせて選べます。
            </p>
          </div>

          <div className={styles.noteCard}>
            <span>出題形式</span>
            <strong>4択 / 仕分け</strong>
            <p>
              問題数と出題範囲は単語クイズ全体で共通です。4択モードではその場で正誤確認、
              仕分けモードでは学習状態の更新まで進められます。
            </p>
            <Link href="/word-quiz/settings" className={styles.settingsLink}>
              出題設定を開く
            </Link>
          </div>
        </div>

        <div className={styles.grid}>
          {GROUP_ORDER.map((group) => (
            <article key={group} className={styles.levelCard}>
              <div className={styles.levelHeader}>
                <p className={styles.levelBadge}>{GROUP_LABELS[group]}</p>
                <span className={styles.levelCount}>{levelProgress[group].total}語</span>
              </div>

              <h2 className={styles.levelTitle}>{GROUP_LABELS[group]}レベル</h2>
              <p className={styles.levelText}>{GROUP_DESCRIPTIONS[group]}</p>

              <div className={styles.levelProgress}>
                <div className={styles.levelProgressHeader}>
                  <span>習得率</span>
                  <strong>{levelProgress[group].percent}%</strong>
                </div>
                <div className={styles.levelProgressBar}>
                  <span
                    className={styles.levelProgressFill}
                    style={{ width: `${levelProgress[group].percent}%` }}
                  />
                </div>
                <div className={styles.levelStats}>
                  <span>習得済 {levelProgress[group].mastered}語</span>
                  <span>要復習 {levelProgress[group].review}語</span>
                  <span>未習得 {levelProgress[group].unlearned}語</span>
                </div>
              </div>

              <div className={styles.levelActions}>
                <Link href={`/word-quiz/${group}`} className={styles.levelAction}>
                  4択で始める
                </Link>
                <Link
                  href={`/word-quiz/${group}?mode=check`}
                  className={styles.levelActionSecondary}
                >
                  わかる / わからない
                </Link>
              </div>

              {(choiceMistakeCounts[group] > 0 || checkMistakeCounts[group] > 0) && (
                <div className={styles.reviewLinks}>
                  {choiceMistakeCounts[group] > 0 && (
                    <Link href={`/word-quiz/${group}?mode=mistakes`} className={styles.levelSettings}>
                      4択ミス {choiceMistakeCounts[group]}問
                    </Link>
                  )}
                  {checkMistakeCounts[group] > 0 && (
                    <Link
                      href={`/word-quiz/${group}?mode=check-mistakes`}
                      className={styles.levelSettings}
                    >
                      わからない {checkMistakeCounts[group]}問
                    </Link>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
