import { rankItem, rankings, Ranking, RankingInfo } from '@tanstack/match-sorter-utils'

// Client-side search tokenization for SimpleTable: comma (or new line, tab) = OR,
// space = AND within a comma part.
export const parseSearchQuery = (query: string): string[][] =>
  query
    .split(/[,\r\n\t]/)
    .map((part) => part.trim().split(/\s+/).filter(Boolean))
    .filter((terms) => terms.length > 0)

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
