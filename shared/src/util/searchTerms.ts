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

// What a slicer row is searched by: its label, its name and its ancestors' labels, so a
// child can be found by its parent path
export const toSlicerSearchHaystack = (
  label: string | undefined,
  name: string | undefined,
  parents: string[] = [],
): string => [label, name, ...parents].join(' ')

interface SearchableFolder {
  id: string
  parentId?: string | null
  name: string
  label?: string | null
}

// The top-most folders the hierarchy slicer search matches. A match on a parent label also
// matches every descendant, so the descendants of a match are left out: the match covers
// them. null when the query is empty, so callers can tell "no search" from "no matches".
export const getSearchMatchedFolderIds = (
  folders: SearchableFolder[],
  query: string,
): string[] | null => {
  const groups = parseSearchQuery(query)
  if (!groups.length) return null

  const ids = new Set(folders.map((folder) => folder.id))
  const childrenOf = new Map<string, SearchableFolder[]>()
  const roots: SearchableFolder[] = []
  for (const folder of folders) {
    if (!folder.parentId || !ids.has(folder.parentId)) {
      roots.push(folder)
      continue
    }
    const siblings = childrenOf.get(folder.parentId)
    if (siblings) siblings.push(folder)
    else childrenOf.set(folder.parentId, [folder])
  }

  const matched: string[] = []
  const stack = roots.map((folder) => ({ folder, parents: [] as string[] }))
  while (stack.length) {
    const { folder, parents } = stack.pop()!
    const label = folder.label || folder.name
    if (matchSearchQuery(toSlicerSearchHaystack(label, folder.name, parents), groups).passed) {
      matched.push(folder.id)
      continue
    }
    const childParents = [...parents, label]
    for (const child of childrenOf.get(folder.id) ?? []) {
      stack.push({ folder: child, parents: childParents })
    }
  }
  return matched
}

interface SearchableRow {
  id: string
  name?: string | null
  label?: string | null
  parents?: string[]
  subRows?: SearchableRow[]
}

// The rows of a slicer panel its search leaves, at any depth. null when the query is empty.
export const getSearchMatchedRowIds = (rows: SearchableRow[], query: string): string[] | null => {
  const groups = parseSearchQuery(query)
  if (!groups.length) return null

  const matched: string[] = []
  const stack = [...rows]
  while (stack.length) {
    const row = stack.pop()!
    const haystack = toSlicerSearchHaystack(row.label ?? undefined, row.name ?? undefined, row.parents)
    if (matchSearchQuery(haystack, groups).passed) matched.push(row.id)
    if (row.subRows?.length) stack.push(...row.subRows)
  }
  return matched
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
