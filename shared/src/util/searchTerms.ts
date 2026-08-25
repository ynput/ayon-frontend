import { rankItem, rankings, RankingInfo } from '@tanstack/match-sorter-utils'

// Canonical client-side search tokenization: comma = OR, space = AND within a comma part.
export const parseSearchQuery = (query: string): string[][] =>
  query
    .split(',')
    .map((part) => part.trim().split(/\s+/).filter(Boolean))
    .filter((terms) => terms.length > 0)

const noMatch: RankingInfo = Object.freeze({
  rankedValue: '',
  rank: rankings.NO_MATCH,
  accessorIndex: -1,
  accessorThreshold: rankings.CONTAINS,
  passed: false,
})

export const matchSearchQuery = (haystack: string, groups: string[][]): RankingInfo => {
  let best: RankingInfo | null = null

  for (const terms of groups) {
    let groupBest: RankingInfo | null = null

    for (const term of terms) {
      const rank = rankItem(haystack, term, { threshold: rankings.CONTAINS })
      if (!rank.passed) {
        groupBest = null
        break
      }
      if (!groupBest || rank.rank > groupBest.rank) groupBest = rank
    }

    if (groupBest && (!best || groupBest.rank > best.rank)) best = groupBest
  }

  return best ?? noMatch
}
