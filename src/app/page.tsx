import Link from 'next/link'
import { GROUP_DESCRIPTIONS, GROUP_LABELS, GROUP_ORDER, WORD_GROUPS } from '@/data/word'
import styles from './page.module.css'

const totalWords = GROUP_ORDER.reduce((sum, group) => sum + WORD_GROUPS[group].length, 0)

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <div className={styles.badge}>Korean Lean</div>

            <h1 className={styles.title}>
              例文ごと覚えて、
              <br />
              韓国語を手になじませる。
            </h1>

            <p className={styles.description}>
              例文クイズ、単語クイズ、単語一覧、キーボード練習を行き来しながら、
              <br />
              読む・見る・押すの流れで少しずつ語彙を増やせる学習アプリです。
            </p>

            <div className={styles.buttonRow}>
              <Link href="/quiz/basic" className={`${styles.button} ${styles.primaryButton}`}>
                クイズをはじめる
              </Link>

              <Link href="/words" className={`${styles.button} ${styles.secondaryButton}`}>
                単語を見る
              </Link>
            </div>
          </div>

          <div className={styles.heroPanel}>
            <div className={styles.summaryCard}>
              <span>学習コース</span>
              <strong>{GROUP_ORDER.length}段階</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>収録語彙</span>
              <strong>{totalWords}語</strong>
            </div>
            <div className={styles.stageList}>
              {GROUP_ORDER.map((group) => (
                <Link key={group} href={`/quiz/${group}`} className={styles.stageItem}>
                  <div>
                    <strong>{GROUP_LABELS[group]}</strong>
                    <p>{GROUP_DESCRIPTIONS[group]}</p>
                  </div>
                  <span>{WORD_GROUPS[group].length}語</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.featureSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>Study Flow</p>
          <h2 className={styles.sectionTitle}>その日の気分に合わせて学ぶ</h2>
        </div>

        <div className={styles.grid}>
          <Link href="/quiz/basic" className={styles.featureCard}>
            <div className={styles.iconWrap}>Q</div>
            <h3 className={styles.cardTitle}>クイズ</h3>
            <p className={styles.cardText}>
              例文の中で単語を確かめながら、わかる・わからないでテンポよく進められます。
            </p>
          </Link>

          <Link href="/words" className={styles.featureCard}>
            <div className={styles.iconWrap}>W</div>
            <h3 className={styles.cardTitle}>単語一覧</h3>
            <p className={styles.cardText}>
              意味、読み、例文をカード形式で確認して、気になる語彙をまとめて見直せます。
            </p>
          </Link>

          <Link href="/keyboard" className={styles.featureCard}>
            <div className={styles.iconWrap}>K</div>
            <h3 className={styles.cardTitle}>キーボード学習</h3>
            <p className={styles.cardText}>
              ハングルのキー配置を視覚的に確認しながら、タイピング感覚も一緒に育てられます。
            </p>
          </Link>

          <Link href="/word-quiz" className={styles.featureCard}>
            <div className={styles.iconWrap}>V</div>
            <h3 className={styles.cardTitle}>単語クイズ</h3>
            <p className={styles.cardText}>
              単語の意味を4択で選びながら、近い語感の選択肢と見比べて理解を深められます。
            </p>
          </Link>
        </div>
      </section>
    </main>
  )
}
