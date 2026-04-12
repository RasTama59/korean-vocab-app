'use client'

import { useEffect, useMemo, useState } from 'react'
import { GROUP_ORDER, WORD_GROUPS } from '@/data/word'
import { playQuizSound } from '@/lib/quiz-audio'
import type { WordItem } from '@/lib/quiz-types'
import styles from './keyboard.module.css'

type KeyItem = {
  key: string
  hangul: string
  shiftHangul?: string
}

function shuffleWords<T>(items: T[]) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
  }

  return next
}

const KEY_ROWS: KeyItem[][] = [
  [
    { key: 'q', hangul: 'ㅂ', shiftHangul: 'ㅃ' },
    { key: 'w', hangul: 'ㅈ', shiftHangul: 'ㅉ' },
    { key: 'e', hangul: 'ㄷ', shiftHangul: 'ㄸ' },
    { key: 'r', hangul: 'ㄱ', shiftHangul: 'ㄲ' },
    { key: 't', hangul: 'ㅅ', shiftHangul: 'ㅆ' },
    { key: 'y', hangul: 'ㅛ' },
    { key: 'u', hangul: 'ㅕ' },
    { key: 'i', hangul: 'ㅑ' },
    { key: 'o', hangul: 'ㅐ', shiftHangul: 'ㅒ' },
    { key: 'p', hangul: 'ㅔ', shiftHangul: 'ㅖ' },
  ],
  [
    { key: 'a', hangul: 'ㅁ' },
    { key: 's', hangul: 'ㄴ' },
    { key: 'd', hangul: 'ㅇ' },
    { key: 'f', hangul: 'ㄹ' },
    { key: 'g', hangul: 'ㅎ' },
    { key: 'h', hangul: 'ㅗ' },
    { key: 'j', hangul: 'ㅓ' },
    { key: 'k', hangul: 'ㅏ' },
    { key: 'l', hangul: 'ㅣ' },
  ],
  [
    { key: 'z', hangul: 'ㅋ' },
    { key: 'x', hangul: 'ㅌ' },
    { key: 'c', hangul: 'ㅊ' },
    { key: 'v', hangul: 'ㅍ' },
    { key: 'b', hangul: 'ㅠ' },
    { key: 'n', hangul: 'ㅜ' },
    { key: 'm', hangul: 'ㅡ' },
  ],
]

export function KeyboardPageClient() {
  const quizWords = useMemo(() => {
    return GROUP_ORDER.flatMap((group) => WORD_GROUPS[group]).filter(
      (item) => item.word && item.meaning
    )
  }, [])

  const [sessionWords, setSessionWords] = useState<WordItem[]>(() => shuffleWords(quizWords))
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  const currentWord = sessionWords[index]
  const isCorrect = input.trim().length > 0 && input.trim() === currentWord.word.trim()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (event.key === 'Shift') {
        setIsShiftPressed(true)
      }

      const allKeys = KEY_ROWS.flat().map((item) => item.key)
      if (allKeys.includes(key)) {
        setActiveKey(key)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false)
      }
      setActiveKey(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const goNext = () => {
    setIndex((prev) => {
      const nextIndex = prev + 1

      if (nextIndex >= sessionWords.length) {
        setSessionWords(shuffleWords(quizWords))
        return 0
      }

      return nextIndex
    })
    setInput('')
  }

  useEffect(() => {
    if (!isCorrect) return

    playQuizSound('correct')

    const timer = setTimeout(() => {
      setIndex((prev) => {
        const nextIndex = prev + 1

        if (nextIndex >= sessionWords.length) {
          setSessionWords(shuffleWords(quizWords))
          return 0
        }

        return nextIndex
      })
      setInput('')
    }, 500)

    return () => clearTimeout(timer)
  }, [isCorrect, quizWords, sessionWords.length])

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.badge}>Keyboard Lab</p>
            <h1 className={styles.title}>ハングルキーボード練習</h1>
          </div>
          <span className={styles.counter}>
            {index + 1} / {sessionWords.length}
          </span>
        </div>

        <p className={styles.description}>
          表示された韓国語を見ながら、そのまま入力して練習します。
        </p>

        <div className={styles.quizBox}>
          <div className={styles.meaningLabel}>お題</div>

          <div className={styles.prompt}>
            <span className={styles.promptWord}>{currentWord.word}</span>
            <span className={styles.promptMeaning}>（{currentWord.meaning}）</span>
          </div>

          <input
            className={styles.input}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ここに韓国語を入力"
          />

          <div className={styles.buttonRow}>
            <button className={`${styles.button} ${styles.primaryButton}`} onClick={goNext}>
              次の単語へ
            </button>
          </div>

          {isCorrect && <p className={styles.correct}>正解です！ 次の問題へ進みます…</p>}
        </div>

        <div className={styles.keyboardBox}>
          <div className={styles.keyboardHeader}>
            <h2 className={styles.keyboardTitle}>キーボード対応表</h2>
            <span className={`${styles.shiftBadge} ${isShiftPressed ? styles.shiftOn : ''}`}>
              Shift {isShiftPressed ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className={styles.keyboard}>
            <div className={styles.keyRow}>
              <div className={`${styles.specialKey} ${isShiftPressed ? styles.activeKey : ''}`}>
                Shift
              </div>

              {KEY_ROWS[0].map((item) => (
                <div
                  key={item.key}
                  className={`${styles.keycap} ${activeKey === item.key ? styles.activeKey : ''}`}
                >
                  <span className={styles.keyTop}>{item.key.toUpperCase()}</span>
                  <span className={styles.keyBottom}>
                    {isShiftPressed && item.shiftHangul ? item.shiftHangul : item.hangul}
                  </span>
                  {item.shiftHangul && (
                    <span className={styles.keyShiftHint}>Shift: {item.shiftHangul}</span>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.keyRow}>
              {KEY_ROWS[1].map((item) => (
                <div
                  key={item.key}
                  className={`${styles.keycap} ${activeKey === item.key ? styles.activeKey : ''}`}
                >
                  <span className={styles.keyTop}>{item.key.toUpperCase()}</span>
                  <span className={styles.keyBottom}>{item.hangul}</span>
                </div>
              ))}
            </div>

            <div className={styles.keyRow}>
              <div className={`${styles.specialKey} ${isShiftPressed ? styles.activeKey : ''}`}>
                Shift
              </div>

              {KEY_ROWS[2].map((item) => (
                <div
                  key={item.key}
                  className={`${styles.keycap} ${activeKey === item.key ? styles.activeKey : ''}`}
                >
                  <span className={styles.keyTop}>{item.key.toUpperCase()}</span>
                  <span className={styles.keyBottom}>{item.hangul}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={styles.helperText}>
            Shift を押すと ㅃ / ㅉ / ㄸ / ㄲ / ㅆ / ㅒ / ㅖ も確認できます。
          </p>
        </div>
      </div>
    </main>
  )
}
