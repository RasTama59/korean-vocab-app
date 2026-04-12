import Link from 'next/link'
import type { Metadata } from 'next'
import './globals.css'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'Korean Lean',
  description: '韓国語の語彙学習とクイズ練習のためのアプリ',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className={`min-h-full flex flex-col ${styles.body}`}>
        <Link href="/" className={styles.homeLink} aria-label="ホームへ戻る">
          <span className={styles.homeIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" className={styles.homeSvg}>
              <path
                d="M4 11.5 12 5l8 6.5v8a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className={styles.homeText}>Home</span>
        </Link>

        {children}

        <footer className={styles.siteFooter}>
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <p className={styles.footerTitle}>Korean Lean</p>
              <p className={styles.footerText}>
                韓国語の語彙学習を、例文クイズ・単語クイズ・一覧・タイピングで続けやすくするための学習サイトです。
              </p>
            </div>

            <nav className={styles.footerNav} aria-label="サイト案内">
              <Link href="/about" className={styles.footerLink}>
                サイトについて
              </Link>
              <Link href="/policy" className={styles.footerLink}>
                ポリシー
              </Link>
              <Link href="/request" className={styles.footerLink}>
                要望フォーム
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  )
}
