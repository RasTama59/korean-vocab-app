import Link from 'next/link'
import type { Metadata } from 'next'
import styles from '../info-page.module.css'

export const metadata: Metadata = {
  title: 'サイトについて | Korean Lean',
  description:
    'Korean Leanでできること、学習データの性質、利用時の注意点をまとめた案内ページです。',
}

const capabilities = [
  {
    title: '例文クイズで覚える',
    text:
      '例文の中で単語の使われ方を確認しながら、わかる・わからないでテンポよく学習できます。',
  },
  {
    title: '単語クイズで意味を確認する',
    text:
      '単語を見て4択で意味を選び、短いサイクルで語彙の定着度を確かめられます。',
  },
  {
    title: 'キーボード練習で綴りを身につける',
    text:
      '単語を見ながらタイピングし、スペルと発音の結びつきを反復できます。',
  },
  {
    title: '単語一覧でまとめて見直す',
    text:
      'レベルやジャンルで絞り込みながら、意味・例文・発音表記を一覧で確認できます。',
  },
]

const cautions = [
  '単語・例文・説明・発音表記は見直しを続けていますが、機械的な生成の影響が残る箇所や重複、表記ゆれ、意味のずれが含まれる場合があります。',
  '例文は学習用に短く調整しているため、実際の会話でより自然な言い回しが別に存在することがあります。',
  '音声読み上げは利用しているブラウザや端末の音声機能に依存するため、発音の聞こえ方が環境によって変わることがあります。',
  '学習結果や設定の一部はブラウザ内に保存されるため、端末やブラウザを変えると引き継がれない場合があります。',
]

const useCases = [
  '韓国語をこれから学び始める人',
  '通勤やすきま時間に短く復習したい人',
  '例文で単語の使い方を一緒に覚えたい人',
  '単語の意味確認とタイピング練習を同じサイトで済ませたい人',
]

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>About Korean Lean</span>
            <h1 className={styles.title}>サイトについて</h1>
            <p className={styles.lead}>
              Korean Lean は、韓国語の語彙を例文・意味・タイピングの3方向から学べる
              学習サポートサイトです。短時間でも触れやすい構成を大切にしつつ、
              少しずつデータの見直しと改善を続けています。
            </p>

            <div className={styles.actionRow}>
              <Link href="/quiz/basic" className={`${styles.button} ${styles.primaryButton}`}>
                例文クイズを始める
              </Link>
              <Link href="/words" className={`${styles.button} ${styles.secondaryButton}`}>
                単語一覧を見る
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionEyebrow}>What You Can Do</p>
          <h2 className={styles.sectionTitle}>このサイトでできること</h2>
          <div className={styles.grid}>
            {capabilities.map((item) => (
              <article key={item.title} className={styles.card}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionEyebrow}>Notes</p>
          <h2 className={styles.sectionTitle}>利用時の注意事項</h2>
          <p className={styles.sectionText}>
            学習しやすさを優先してデータを整えていますが、辞書や公式教材の完全な代替を目的にしたものではありません。
            気になる表記や不自然な内容を見つけた場合は、要望フォームから教えていただけると助かります。
          </p>

          <ul className={styles.list}>
            {cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className={styles.notePanel}>
            <h3 className={styles.noteTitle}>特に知っておいてほしいこと</h3>
            <p className={styles.noteText}>
              単語データには、見直し途中の重複や修正対象が含まれることがあります。内容の正確性を高めるために継続更新していますが、
              最終確認が必要な場面では辞書・教材・ネイティブ監修資料と併用してください。
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionEyebrow}>Best For</p>
          <h2 className={styles.sectionTitle}>こんな使い方に向いています</h2>
          <ul className={styles.list}>
            {useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
