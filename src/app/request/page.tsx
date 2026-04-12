import type { Metadata } from 'next'
import { WORD_REPORT_FORM_PUBLIC_URL } from '@/lib/word-report'
import styles from '../info-page.module.css'

export const metadata: Metadata = {
  title: '要望フォーム | Korean Lean',
  description:
    '誤字・重複・不自然な例文や発音表記、機能改善の要望を送れるKorean Leanの案内ページです。',
}

export default function RequestPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>Request Form</span>
            <h1 className={styles.title}>要望フォーム</h1>
            <p className={styles.lead}>
              誤字の修正依頼、単語データの重複報告、UI の改善希望、追加してほしい機能などを送るためのページです。
              学習しながら気になった点があれば、遠慮なく教えてください。
            </p>
          </div>
        </section>

        <section className={styles.formCard}>
          <p className={styles.sectionEyebrow}>Google Form</p>
          <h2 className={styles.sectionTitle}>フォームはこちらから送れます</h2>
          <p className={styles.formLead}>
            下のボタンを押すと Google フォームが開きます。別タブで開くので、サイトを閉じずにそのまま送信できます。
          </p>

          <div className={styles.actionRow}>
            <a
              href={WORD_REPORT_FORM_PUBLIC_URL}
              target="_blank"
              rel="noreferrer"
              className={`${styles.button} ${styles.primaryButton}`}
            >
              要望フォームを開く
            </a>
          </div>

          <div className={styles.urlBox}>{WORD_REPORT_FORM_PUBLIC_URL}</div>
        </section>
      </div>
    </main>
  )
}
