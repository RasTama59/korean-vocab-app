import type { ReactNode } from 'react'

type HighlightRange = {
  start: number
  end: number
}

function getPrefixMatchLength(source: string, target: string) {
  let length = 0

  while (
    length < source.length &&
    length < target.length &&
    source[length] === target[length]
  ) {
    length += 1
  }

  return length
}

function findCandidateRanges(sentence: string, candidate: string, candidateIndex: number) {
  const trimmed = candidate.trim()
  if (!trimmed) return []

  let bestMatch:
    | {
        range: HighlightRange
        length: number
        tokenLength: number
        candidateIndex: number
      }
    | undefined

  for (const match of sentence.matchAll(/[\p{L}\p{N}]+/gu)) {
    const token = match[0]
    const start = match.index ?? 0
    const matchLength = getPrefixMatchLength(token, trimmed)

    if (matchLength === 0) {
      continue
    }

    if (
      !bestMatch ||
      matchLength > bestMatch.length ||
      (matchLength === bestMatch.length && token.length > bestMatch.tokenLength) ||
      (matchLength === bestMatch.length &&
        token.length === bestMatch.tokenLength &&
        candidateIndex < bestMatch.candidateIndex) ||
      (matchLength === bestMatch.length &&
        token.length === bestMatch.tokenLength &&
        candidateIndex === bestMatch.candidateIndex &&
        start > bestMatch.range.start)
    ) {
      bestMatch = {
        range: {
          start,
          end: start + matchLength,
        },
        length: matchLength,
        tokenLength: token.length,
        candidateIndex,
      }
    }
  }

  return bestMatch ? [bestMatch.range] : []
}

function scoreRanges(ranges: HighlightRange[]) {
  return ranges.reduce((total, range) => total + (range.end - range.start), 0)
}

function getBestHighlightRanges(sentence: string, candidates: Array<string | undefined>) {
  return candidates
    .map((candidate, index) => findCandidateRanges(sentence, candidate ?? '', index))
    .sort((left, right) => scoreRanges(right) - scoreRanges(left))[0] ?? []
}

export function renderHighlightedSentence(
  sentence: string,
  candidates: Array<string | undefined>,
  highlightClassName: string
): ReactNode {
  const ranges = getBestHighlightRanges(sentence, candidates)
  if (ranges.length === 0) return sentence

  const fragments: ReactNode[] = []
  let cursor = 0

  ranges.forEach((range, index) => {
    if (cursor < range.start) {
      fragments.push(
        <span key={`plain-${index}-${cursor}`}>{sentence.slice(cursor, range.start)}</span>
      )
    }

    fragments.push(
      <span key={`highlight-${index}-${range.start}`} className={highlightClassName}>
        {sentence.slice(range.start, range.end)}
      </span>
    )

    cursor = range.end
  })

  if (cursor < sentence.length) {
    fragments.push(<span key={`tail-${cursor}`}>{sentence.slice(cursor)}</span>)
  }

  return fragments
}
