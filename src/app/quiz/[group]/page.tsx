'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  GROUP_DESCRIPTIONS,
  GROUP_LABELS,
  GROUP_ORDER,
  getWordsByGroup,
} from '@/data/word'
import { loadMistakeWordIds } from '@/lib/mistake-review-storage'
import { QuizGroup } from '@/lib/quiz-types'
import { getCounts, getWordProgress, loadQuizState } from '@/lib/quiz-storage'
import styles from './group.module.css'

export default function QuizGroupPage() {
  const params = useParams()
  const group = params.group as QuizGroup
  const words = useMemo(() => getWordsByGroup(group), [group])

  const [state] = useState(() => loadQuizState())
  const [mistakeCount, setMistakeCount] = useState(() => loadMistakeWordIds('example-quiz', group).length)

  useEffect(() => {
    setMistakeCount(loadMistakeWordIds('example-quiz', group).length)
  }, [group])

  const counts = getCounts(
    state,
    group,
    words.map((word) => word.id)
  )

  const total = words.length
  const settings = state[group].settings
  const percent = total === 0 ? 0 : Math.round((counts.mastered / total) * 100)
  const sessionCount = Math.min(settings.questionCount, total)
  const reviewTargetCount = words.filter((word) => {
    const status = getWordProgress(state, group, word.id).status
    return settings.reviewTargets.includes(status)
  }).length
  const reviewSessionCount = Math.min(settings.questionCount, reviewTargetCount)

  const masteredWidth = total === 0 ? 0 : (counts.mastered / total) * 100
  const reviewWidth = total === 0 ? 0 : (counts.review / total) * 100
  const unlearnedWidth = total === 0 ? 0 : (counts.unlearned / total) * 100

  const currentIndex = GROUP_ORDER.indexOf(group)
  const previousGroup = GROUP_ORDER[(currentIndex - 1 + GROUP_ORDER.length) % GROUP_ORDER.length]
  const nextGroup = GROUP_ORDER[(currentIndex + 1) % GROUP_ORDER.length]

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.switcherBar}>
          <Link
            href={`/quiz/${previousGroup}`}
            className={styles.arrowButton}
            aria-label={`${GROUP_LABELS[previousGroup]}へ移動`}
          >
            ←
          </Link>

          <div className={styles.switcherCenter}>
            <p className={styles.switcherLabel}>Course Switch</p>
            <div className={styles.tabRow}>
              {GROUP_ORDER.map((item) => (
                <Link
                  key={item}
                  href={`/quiz/${item}`}
                  className={item === group ? styles.activeTab : styles.tab}
                >
                  {GROUP_LABELS[item]}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href={`/quiz/${nextGroup}`}
            className={styles.arrowButton}
            aria-label={`${GROUP_LABELS[nextGroup]}へ移動`}
          >
            →
          </Link>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Korean Lean Quiz</p>
            <h1 className={styles.title}>{GROUP_LABELS[group]}コース</h1>
            <p className={styles.subtitle}>
              {GROUP_DESCRIPTIONS[group]}
              今日の設定では最大{sessionCount}問まで、今の理解度に合わせてテンポよく確認できます。
            </p>

            <div className={styles.metaRow}>
              <div className={styles.metaCard}>
                <span>1回の設定問題数</span>
                <strong>{sessionCount}問</strong>
              </div>
              <div className={styles.metaCard}>
                <span>復習条件に一致</span>
                <strong>{reviewTargetCount}問</strong>
              </div>
            </div>
          </div>

          <div className={styles.progressPanel}>
            <p className={styles.progressLabel}>習得率</p>
            <div className={styles.progressNumber}>
              {percent}
              <span>%</span>
            </div>
            <div className={styles.progressBar}>
              <span className={styles.progressFill} style={{ width: `${percent}%` }} />
            </div>

            <div className={styles.segmentBar}>
              <span className={styles.segmentMastered} style={{ width: `${masteredWidth}%` }} />
              <span className={styles.segmentReview} style={{ width: `${reviewWidth}%` }} />
              <span className={styles.segmentUnlearned} style={{ width: `${unlearnedWidth}%` }} />
            </div>

            <div className={styles.legend}>
              <span>習得済 {counts.mastered}問</span>
              <span>要復習 {counts.review}問</span>
              <span>未習得 {counts.unlearned}問</span>
            </div>
          </div>
        </div>

        <div className={styles.statGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>未習得</span>
            <strong className={styles.statValue}>{counts.unlearned}</strong>
            <p className={styles.statText}>初見やまだ不安のある単語です。</p>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>要復習</span>
            <strong className={styles.statValue}>{counts.review}</strong>
            <p className={styles.statText}>一度わかるを押した問題が入ります。</p>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>習得済</span>
            <strong className={styles.statValue}>{counts.mastered}</strong>
            <p className={styles.statText}>繰り返し正解して定着した単語です。</p>
          </article>
        </div>

        <div className={styles.actionPanel}>
          <div>
            <p className={styles.actionEyebrow}>Today&apos;s Session</p>
            <h2 className={styles.actionTitle}>すぐに始める</h2>
            <p className={styles.actionText}>
              ランダムで幅広く確認するか、復習条件に合う問題だけに集中するかを選べます。
            </p>
          </div>

          <div className={styles.buttonRow}>
            <Link href={`/quiz/${group}/play?mode=random`} className={styles.primaryBtn}>
              クイズを始める
            </Link>
            <Link href={`/quiz/${group}/play?mode=review`} className={styles.secondaryBtn}>
              復習モード {reviewSessionCount}問
            </Link>
            {mistakeCount > 0 && (
              <Link href={`/quiz/${group}/play?mode=mistakes`} className={styles.secondaryBtn}>
                間違えた単語 {mistakeCount}問
              </Link>
            )}
          </div>

          <Link href={`/quiz/${group}/settings`} className={styles.settingsLink}>
            復習設定を調整する
          </Link>
        </div>
      </section>
    </main>
  )
}
