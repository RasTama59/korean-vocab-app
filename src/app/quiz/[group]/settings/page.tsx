'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { GROUP_LABELS, getWordsByGroup } from '@/data/word'
import { QuizGroup, StudyStatus } from '@/lib/quiz-types'
import { loadQuizState, saveQuizState, updateGroupSettings } from '@/lib/quiz-storage'
import styles from './settings.module.css'

export default function QuizSettingsPage() {
  const params = useParams()
  const group = params.group as QuizGroup
  const words = useMemo(() => getWordsByGroup(group), [group])

  const [state, setState] = useState(loadQuizState)
  const settings = state[group].settings
  const selectedTargetCount = settings.reviewTargets.length

  const toggleStatus = (status: StudyStatus) => {
    const exists = settings.reviewTargets.includes(status)
    const nextTargets = exists
      ? settings.reviewTargets.filter((item) => item !== status)
      : [...settings.reviewTargets, status].sort()

    const next = updateGroupSettings(state, group, {
      ...settings,
      reviewTargets: nextTargets,
    })
    setState(next)
    saveQuizState(next)
  }

  const changeCount = (delta: number) => {
    const nextCount = Math.max(1, Math.min(words.length, settings.questionCount + delta))
    const next = updateGroupSettings(state, group, {
      ...settings,
      questionCount: nextCount,
    })
    setState(next)
    saveQuizState(next)
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link href={`/quiz/${group}`} className={styles.backLink}>
          {GROUP_LABELS[group]}クイズへ戻る
        </Link>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Review Settings</p>
          <h1 className={styles.title}>{GROUP_LABELS[group]}の復習条件</h1>
          <p className={styles.description}>
            出題したい理解度と、1回の学習で出す問題数をここで調整できます。
          </p>
        </div>

        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <span>選択中の理解度</span>
            <strong>{selectedTargetCount}件</strong>
          </div>
          <div className={styles.summaryCard}>
            <span>対象の総単語数</span>
            <strong>{words.length}語</strong>
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.row}>
            <div>
              <div className={styles.rowTitle}>未習得</div>
              <div className={styles.rowDesc}>まだ覚えきれていない問題を出題します</div>
            </div>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={settings.reviewTargets.includes(0)}
              onChange={() => toggleStatus(0)}
            />
          </label>

          <label className={styles.row}>
            <div>
              <div className={styles.rowTitle}>要復習</div>
              <div className={styles.rowDesc}>一度わかるを押した問題を中心に出題します</div>
            </div>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={settings.reviewTargets.includes(1)}
              onChange={() => toggleStatus(1)}
            />
          </label>

          <label className={styles.row}>
            <div>
              <div className={styles.rowTitle}>習得済</div>
              <div className={styles.rowDesc}>定着確認として習得済みの問題も出題します</div>
            </div>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={settings.reviewTargets.includes(2)}
              onChange={() => toggleStatus(2)}
            />
          </label>
        </div>

        {selectedTargetCount === 0 && (
          <p className={styles.warning}>
            理解度が未選択のため、復習モードでは問題が表示されません。
          </p>
        )}

        <div className={styles.countBox}>
          <div>
            <div className={styles.countLabel}>1回の学習問題数</div>
            <div className={styles.countHelp}>現在のグループでは最大{words.length}語まで設定できます。</div>
          </div>

          <div className={styles.countRow}>
            <button
              type="button"
              onClick={() => changeCount(-10)}
              className={styles.countButton}
            >
              −
            </button>
            <span className={styles.countNumber}>{settings.questionCount}問</span>
            <button
              type="button"
              onClick={() => changeCount(10)}
              className={styles.countButton}
            >
              ＋
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
