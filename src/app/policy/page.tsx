import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/page-metadata'
import styles from '../info-page.module.css'

export const metadata: Metadata = createPageMetadata({
  title: 'ポリシー',
  description:
    'Korean Leanの利用方針、広告・外部サービスの扱い、フォーム送信時の注意点をまとめたページです。',
  path: '/policy',
})

const policies = [
  {
    title: '1. 運営方針',
    text:
      'Korean Lean は、韓国語学習を助けることを目的とした学習支援サイトです。例文クイズ、単語クイズ、単語一覧、タイピング練習などを通じて、学習の継続を後押しすることを目指しています。',
  },
  {
    title: '2. データと表現について',
    text:
      '掲載している単語、例文、説明、発音表記は見直しを続けていますが、機械的な生成の影響、重複、表記ゆれ、不自然な訳や説明が残る場合があります。内容の正確性や完全性は保証せず、必要に応じて辞書や公式教材と併用してください。',
  },
  {
    title: '3. 外部サービスと広告について',
    text:
      '本サイトでは、今後を含めて広告配信やアクセス解析のために外部サービスを利用する場合があります。その際、Cookie 等の技術を通じて利用状況が取得されることがあります。広告のパーソナライズ設定は、利用ブラウザや各サービスの設定画面から調整してください。',
  },
  {
    title: '4. 要望フォームと送信情報について',
    text:
      '要望フォームは Google Forms を利用しています。フォームに入力された内容は、誤字修正、機能改善、要望確認、必要に応じた返信のために使用します。送信された情報は Google の提供する仕組み上で取り扱われるため、Google 側の利用条件やプライバシーの取扱いもあわせてご確認ください。',
  },
  {
    title: '5. 禁止事項',
    text:
      'サービスの運営を妨げる行為、過度な自動アクセス、違法または不正な目的での利用、第三者に不利益を与える行為、公序良俗に反する行為は禁止します。',
  },
  {
    title: '6. 免責と変更',
    text:
      '本サイトの利用によって生じた直接・間接の損害について、運営者は責任を負いません。掲載内容や本ポリシーは、必要に応じて予告なく変更されることがあります。',
  },
]

export default function PolicyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>Site Policy</span>
            <h1 className={styles.title}>ポリシー</h1>
            <p className={styles.lead}>
              このページでは、Korean Lean の利用方針、外部サービスの利用、フォーム送信時の扱い、
              そしてご利用にあたっての基本的な注意点をまとめています。
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionEyebrow}>Policy Overview</p>
          <h2 className={styles.sectionTitle}>基本方針</h2>
          <div className={styles.policyBlock}>
            {policies.map((item) => (
              <article key={item.title} className={styles.policyCard}>
                <h3 className={styles.policyTitle}>{item.title}</h3>
                <p className={styles.policyText}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
