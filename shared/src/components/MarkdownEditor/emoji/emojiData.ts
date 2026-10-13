// Same data (and shortcode names) the comment renderer uses through remark-emoji / node-emoji
import emojiLib from 'emojilib/emojis.json'
import emojiOrder from 'emojilib/ordered.json'

export interface EmojiItem {
  // shortcode without colons, e.g. `thumbsup`
  name: string
  char: string
  keywords: string[]
}

type EmojiLib = Record<string, { char: string | null; keywords: string[] }>

const lib = emojiLib as EmojiLib
// popular emoji first, anything missing from the order after
const names = [
  ...(emojiOrder as string[]),
  ...Object.keys(lib).filter((name) => !(emojiOrder as string[]).includes(name)),
]

const EMOJIS: EmojiItem[] = names.flatMap((name) => {
  const data = lib[name]
  return data?.char ? [{ name, char: data.char, keywords: data.keywords }] : []
})

const EMOJIS_BY_NAME = new Map(EMOJIS.map((emoji) => [emoji.name, emoji]))

export const getEmoji = (name: string) => EMOJIS_BY_NAME.get(name.toLowerCase())

export interface EmojiMatch extends EmojiItem {
  // the keyword that matched when the name did not, e.g. `thumbsup` for `+1`
  matchedKeyword?: string
}

// lower is better, null is no match
const match = (emoji: EmojiItem, query: string): { score: number; keyword?: string } | null => {
  const { name, keywords } = emoji
  if (name === query) return { score: 0 }
  if (name.startsWith(query)) return { score: 1 }
  const exactKeyword = keywords.find((keyword) => keyword.toLowerCase() === query)
  if (exactKeyword) return { score: 2, keyword: exactKeyword }
  // start of a word in the name, e.g. `smile` in `sweat_smile`
  if (name.includes(`_${query}`)) return { score: 3 }
  const keyword = keywords.find((k) => k.toLowerCase().startsWith(query))
  if (keyword) return { score: 4, keyword }
  if (name.includes(query)) return { score: 5 }
  return null
}

export const searchEmoji = (query: string, limit = 8, usage: EmojiUsage = {}): EmojiMatch[] => {
  const search = query.toLowerCase()
  const results: { emoji: EmojiMatch; score: number; index: number }[] = []
  EMOJIS.forEach((emoji, index) => {
    const result = match(emoji, search)
    if (result) {
      results.push({
        emoji: { ...emoji, matchedKeyword: result.keyword },
        score: result.score,
        index,
      })
    }
  })
  return results
    .sort(
      (a, b) =>
        a.score - b.score ||
        (usage[b.emoji.name] ?? 0) - (usage[a.emoji.name] ?? 0) ||
        a.index - b.index,
    )
    .slice(0, limit)
    .map(({ emoji }) => emoji)
}

// shown before the user has used any emoji
export const DEFAULT_EMOJI_NAMES = [
  '+1',
  'heart',
  'joy',
  'tada',
  'smile',
  'pray',
  'fire',
  'eyes',
  'white_check_mark',
  'rocket',
  'thinking',
  'clap',
  'raised_hands',
  'sweat_smile',
  '100',
  'x',
]

// emoji name -> times the user picked it
export type EmojiUsage = Record<string, number>

const byUsage = (usage: EmojiUsage) => (a: string, b: string) => (usage[b] ?? 0) - (usage[a] ?? 0)

/**
 * Suggestions for a `:query`. Without a query: the user's most used emoji, topped up with the
 * default list. With a query: search results, the user's most used first within the same match
 * quality.
 */
export const getEmojiSuggestions = (
  query: string,
  usage: EmojiUsage = {},
  limit = 8,
): EmojiMatch[] => {
  if (!query) {
    const used = Object.keys(usage)
      .filter((name) => usage[name] > 0)
      .sort(byUsage(usage))
    const names = [...new Set([...used, ...DEFAULT_EMOJI_NAMES])]
    return names.flatMap((name) => getEmoji(name) ?? []).slice(0, limit)
  }
  return searchEmoji(query, limit, usage)
}
