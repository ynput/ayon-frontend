import { rankItem, rankings, Ranking, RankingInfo } from '@tanstack/match-sorter-utils'

// Client-side search tokenization for SimpleTable: comma (or new line, tab) = OR,
// space = AND within a comma part.
export const parseSearchQuery = (query: string): string[][] =>
  query
    .split(/[,\r\n\t]/)
    .map((part) => part.trim().split(/\s+/).filter(Boolean))
    .filter((terms) => terms.length > 0)

// The same search as a filter with one condition per term, for searches matched elsewhere
export const searchQueryToFilter = <C>(query: string, toCondition: (term: string) => C) => {
  const groups = parseSearchQuery(query)
  if (!groups.length) return null
  return {
    operator: 'or' as const,
    conditions: groups.map((terms) => ({
      operator: 'and' as const,
      conditions: terms.map(toCondition),
    })),
  }
}

const rankOf = (rank: Ranking, passed: boolean): RankingInfo =>
  Object.freeze({
    rankedValue: '',
    rank,
    accessorIndex: -1,
    accessorThreshold: rankings.CONTAINS,
    passed,
  })

const noMatch = rankOf(rankings.NO_MATCH, false)
const emptyQuery = rankOf(rankings.CONTAINS, true)

export const matchSearchQuery = (haystack: string, groups: string[][]): RankingInfo => {
  if (!groups.length) return emptyQuery

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

// best matches first
export const filterBySearchQuery = <T>(
  items: T[],
  query: string,
  toHaystack: (item: T) => string,
): T[] => {
  const groups = parseSearchQuery(query)
  if (!groups.length) return items
  return items
    .map((item) => ({ item, rank: matchSearchQuery(toHaystack(item), groups) }))
    .filter(({ rank }) => rank.passed)
    .sort((a, b) => b.rank.rank - a.rank.rank)
    .map(({ item }) => item)
}

// A list pasted from a spreadsheet column or row, or one name per line, as a comma
// separated search. Returns null when the text has no new lines or tabs, so the
// browser can paste it as usual. Single-line inputs drop new lines on paste, so
// this has to run in the paste handler, not on the input value.
export const pastedListToSearch = (text: string): string | null => {
  if (!/[\r\n\t]/.test(text)) return null
  return text
    .replace(/[\r\n\t]+/g, ',')
    .replace(/,+/g, ',')
    .replace(/^,|,$/g, '')
}
