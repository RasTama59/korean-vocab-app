'use client'

import Link from 'next/link'
import { startTransition, useDeferredValue, useState } from 'react'
import { FavoriteButton } from '@/components/favorite-button'
import { WordReportLink } from '@/components/word-report-link'
import { renderHighlightedSentence } from '@/lib/example-highlight'
import {
  loadFavoriteWordKeys,
  makeFavoriteWordKey,
  saveFavoriteWordKeys,
  toggleFavoriteWordKey,
} from '@/lib/favorite-words'
import type { QuizGroup, WordItem } from '@/lib/quiz-types'
import styles from './words.module.css'

type LibraryWord = WordItem & {
  group: QuizGroup
}

type LevelOption = {
  value: QuizGroup
  label: string
  count: number
}

type WordLibraryProps = {
  words: LibraryWord[]
  levelOptions: LevelOption[]
  genreOptions: string[]
}

function includesSearchText(word: LibraryWord, query: string) {
  if (!query) return true

  const searchTarget = [
    word.word,
    word.baseForm,
    word.highlightText,
    word.readingKatakana,
    word.romanization,
    word.meaning,
    word.example,
    word.exampleTranslation,
    word.description,
    word.usage,
    word.hint,
    word.partOfSpeech,
    word.formality,
    ...word.genres,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()

  return searchTarget.includes(query)
}

export default function WordLibrary({
  words,
  levelOptions,
  genreOptions,
}: WordLibraryProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<QuizGroup[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [favoriteWordKeys, setFavoriteWordKeys] = useState(() => loadFavoriteWordKeys())
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const deferredSearchText = useDeferredValue(searchText)
  const normalizedQuery = deferredSearchText.trim().toLocaleLowerCase()
  const favoriteKeySet = new Set(favoriteWordKeys)
  const favoriteCount = words.filter((word) =>
    favoriteKeySet.has(makeFavoriteWordKey(word.group, word.id))
  ).length

  const filteredWords = words.filter((word) => {
    if (selectedLevels.length > 0 && !selectedLevels.includes(word.group)) {
      return false
    }

    if (selectedGenres.length > 0 && !selectedGenres.some((genre) => word.genres.includes(genre))) {
      return false
    }

    if (favoritesOnly && !favoriteKeySet.has(makeFavoriteWordKey(word.group, word.id))) {
      return false
    }

    return includesSearchText(word, normalizedQuery)
  })

  const activeLevelLabel =
    selectedLevels.length === 0
      ? 'すべてのレベル'
      : `${selectedLevels.length}件選択中`

  const toggleGenre = (genre: string) => {
    startTransition(() => {
      setSelectedGenres((current) =>
        current.includes(genre)
          ? current.filter((item) => item !== genre)
          : [...current, genre]
      )
    })
  }

  const toggleLevel = (level: QuizGroup) => {
    startTransition(() => {
      setSelectedLevels((current) =>
        current.includes(level)
          ? current.filter((item) => item !== level)
          : [...current, level]
      )
    })
  }

  const clearFilters = () => {
    startTransition(() => {
      setSearchText('')
      setSelectedLevels([])
      setSelectedGenres([])
      setFavoritesOnly(false)
    })
  }

  const handleToggleFavorite = (group: QuizGroup, wordId: number) => {
    startTransition(() => {
      const nextKeys = toggleFavoriteWordKey(favoriteWordKeys, group, wordId)
      setFavoriteWordKeys(nextKeys)
      saveFavoriteWordKeys(nextKeys)
    })
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCard}>
          <p className={styles.badge}>Word Library</p>
          <h1 className={styles.title}>単語一覧</h1>
          <p className={styles.description}>
            クイズ画面と同じ単語データを一覧で確認できます。単語・意味・例文を検索しながら、
            レベルとジャンルでしぼって復習したい語をすばやく探せます。
          </p>

          <div className={styles.heroActions}>
            <Link href="/quiz/basic" className={`${styles.button} ${styles.primaryButton}`}>
              クイズを始める
            </Link>
            <Link href="/" className={`${styles.button} ${styles.secondaryButton}`}>
              ホームに戻る
            </Link>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLead}>
            <span>表示中</span>
            <strong>{filteredWords.length}語</strong>
          </div>

          <div className={styles.summaryMeta}>
            <div className={styles.summaryRow}>
              <span>総単語数</span>
              <strong>{words.length}語</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>現在のレベル</span>
              <strong>{activeLevelLabel}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>選択ジャンル</span>
              <strong>{selectedGenres.length === 0 ? '指定なし' : `${selectedGenres.length}件`}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>お気に入り</span>
              <strong>{favoriteCount}語</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.filterCard}>
        <div className={styles.filterTop}>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>文字検索</span>
            <input
              type="search"
              className={styles.searchInput}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="単語・意味・読み・例文で検索"
            />
          </label>

          <button type="button" className={`${styles.button} ${styles.resetButton}`} onClick={clearFilters}>
            絞り込みをクリア
          </button>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <h2>レベル</h2>
            <p>複数選択</p>
          </div>

          <div className={styles.filterPills}>
            <button
              type="button"
              className={`${styles.filterPill} ${selectedLevels.length === 0 ? styles.filterPillActive : ''}`}
              onClick={() => startTransition(() => setSelectedLevels([]))}
            >
              すべて
            </button>

            {levelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.filterPill} ${
                  selectedLevels.includes(option.value) ? styles.filterPillActive : ''
                }`}
                onClick={() => toggleLevel(option.value)}
              >
                {option.label}
                <span className={styles.filterCount}>{option.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <h2>お気に入り</h2>
            <p>ワンタップ切替</p>
          </div>

          <div className={styles.filterPills}>
            <button
              type="button"
              className={`${styles.filterPill} ${!favoritesOnly ? styles.filterPillActive : ''}`}
              onClick={() => startTransition(() => setFavoritesOnly(false))}
            >
              すべて
            </button>
            <button
              type="button"
              className={`${styles.filterPill} ${favoritesOnly ? styles.filterPillActive : ''}`}
              onClick={() => startTransition(() => setFavoritesOnly(true))}
            >
              お気に入りのみ
            </button>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <h2>ジャンル</h2>
            <p>複数選択</p>
          </div>

          <div className={styles.genreGrid}>
            {genreOptions.map((genre) => {
              const isActive = selectedGenres.includes(genre)

              return (
                <button
                  key={genre}
                  type="button"
                  className={`${styles.genreChip} ${isActive ? styles.genreChipActive : ''}`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <div>
            <p className={styles.resultsEyebrow}>Filtered Results</p>
            <h2 className={styles.resultsTitle}>参照一覧</h2>
          </div>
          <p className={styles.resultsText}>
            クイズと同じ例文・訳・解説をそのまま確認できます。
          </p>
        </div>

        {filteredWords.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>条件に合う単語が見つかりませんでした</h3>
            <p>検索語かフィルタ条件を少しゆるめると、見つかりやすくなります。</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {filteredWords.map((word) => (
              <article key={word.id} className={styles.wordCard}>
                <div className={styles.wordHeader}>
                  <div>
                    <p className={styles.levelLabel}>{levelOptions.find((option) => option.value === word.group)?.label}</p>
                    <h3 className={styles.wordTitle}>{word.word}</h3>
                    {word.readingKatakana && <p className={styles.reading}>{word.readingKatakana}</p>}
                  </div>

                  <div className={styles.wordHeaderMeta}>
                    <FavoriteButton
                      active={favoriteKeySet.has(makeFavoriteWordKey(word.group, word.id))}
                      onClick={() => handleToggleFavorite(word.group, word.id)}
                    />
                    <span className={styles.partOfSpeech}>{word.partOfSpeech}</span>
                    {word.formality && <span className={styles.formality}>{word.formality}</span>}
                    <WordReportLink group={word.group} source="word-library" word={word} />
                  </div>
                </div>

                <p className={styles.meaning}>{word.meaning}</p>

                <div className={styles.exampleBox}>
                  <p className={styles.example}>
                    {renderHighlightedSentence(
                      word.example,
                      [word.highlightText, word.word, word.baseForm],
                      styles.highlight
                    )}
                  </p>
                  <p className={styles.translation}>{word.exampleTranslation}</p>
                </div>

                <div className={styles.genreList}>
                  {word.genres.map((genre) => (
                    <span key={`${word.id}-${genre}`} className={styles.genreTag}>
                      {genre}
                    </span>
                  ))}
                </div>

                <details className={styles.detailsBox}>
                  <summary className={styles.detailsSummary}>参照を見る</summary>

                  <div className={styles.detailContent}>
                    {word.highlightText && word.highlightText !== word.word && (
                      <p className={styles.detailLine}>
                        <strong>文中の形:</strong> {word.highlightText}
                      </p>
                    )}

                    {word.description && (
                      <p className={styles.detailLine}>
                        <strong>解説:</strong> {word.description}
                      </p>
                    )}

                    {word.usage && (
                      <p className={styles.detailLine}>
                        <strong>使い方:</strong> {word.usage}
                      </p>
                    )}

                    {word.hint && (
                      <p className={styles.detailLine}>
                        <strong>ヒント:</strong> {word.hint}
                      </p>
                    )}

                    {word.synonyms && word.synonyms.length > 0 && (
                      <div className={styles.relatedBox}>
                        <strong>類義語</strong>
                        <ul className={styles.relatedList}>
                          {word.synonyms.map((item, index) => (
                            <li key={`${word.id}-syn-${index}`}>
                              {item.word} / {item.meaning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {word.antonyms && word.antonyms.length > 0 && (
                      <div className={styles.relatedBox}>
                        <strong>対義語</strong>
                        <ul className={styles.relatedList}>
                          {word.antonyms.map((item, index) => (
                            <li key={`${word.id}-ant-${index}`}>
                              {item.word} / {item.meaning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Link href={`/quiz/${word.group}`} className={`${styles.button} ${styles.cardAction}`}>
                      このレベルを開く
                    </Link>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
