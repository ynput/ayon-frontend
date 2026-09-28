import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CHECK_LIST,
  CODE,
  HEADING,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
  type TextMatchTransformer,
  type Transformer,
} from '@lexical/markdown'
import { $createTextNode, $getEditor, $isLineBreakNode, LineBreakNode, TextNode } from 'lexical'
import { EMOJI_USED_COMMAND } from '../emoji/commands'
import { getEmoji } from '../emoji/emojiData'
import { $createMentionNode, $isMentionNode, MentionNode } from '../nodes/MentionNode'
import { MENTION_REF_TYPES } from '../types'

// Only spaces are encoded so ids like `team:Sons of thunder` survive markdown link parsing.
// Matches the encoding used by the legacy editor and the comment renderer.
export const encodeMentionId = (id: string) => id.replaceAll(' ', '%20')

const decodeMentionId = (id: string) => {
  try {
    return decodeURIComponent(id)
  } catch {
    return id
  }
}

// brackets would end the link label early
const sanitizeMentionLabel = (label: string) => label.replace(/[[\]]/g, '')

const refTypes = MENTION_REF_TYPES.join('|')
// legacy content can carry an `@` in front of the reference, e.g. `[Luke](@user:luke)`
const MENTION_SOURCE = `\\[([^\\]\\n]+)\\]\\(@?(${refTypes}):([^)\\s]+)\\)`

// `[label](type:id)` <-> MentionNode
export const MENTION: TextMatchTransformer = {
  dependencies: [MentionNode],
  export: (node) => {
    if (!$isMentionNode(node)) return null
    const label = sanitizeMentionLabel(node.getLabel())
    return `[${label}](${node.getMentionType()}:${encodeMentionId(node.getMentionId())})`
  },
  importRegExp: new RegExp(MENTION_SOURCE),
  regExp: new RegExp(MENTION_SOURCE + '$'),
  replace: (textNode, match) => {
    const [, label, type, id] = match
    const mentionNode = $createMentionNode(type, decodeMentionId(id), label.replace(/^@+/, ''))
    textNode.replace(mentionNode)
    return mentionNode
  },
  trigger: ')',
  type: 'text-match',
}

// Every line break in the editor is a real line break (shift+enter), so always write it as a
// CommonMark hard break. A plain `\n` would be rendered as a space by the comment renderer.
export const HARD_LINE_BREAK: TextMatchTransformer = {
  dependencies: [LineBreakNode],
  export: (node) => ($isLineBreakNode(node) ? '\\\n' : null),
  // never matches, line breaks are imported by the paragraph importer
  importRegExp: /(?!)/,
  regExp: /(?!)$/,
  replace: () => {},
  type: 'text-match',
}

// Typing the closing colon of a known shortcode (`:tada:`) inserts the emoji. Only while typing:
// shortcodes in imported markdown are left as they are (the comment renderer shows them).
export const EMOJI_SHORTCODE: TextMatchTransformer = {
  dependencies: [TextNode],
  export: () => null,
  importRegExp: /(?!)/,
  regExp: /:([a-z0-9_+-]+):$/i,
  replace: (textNode, match) => {
    // `:name:` in inline code is code
    if (textNode.hasFormat('code')) return
    const emoji = getEmoji(match[1])
    if (!emoji) return
    const emojiNode = $createTextNode(emoji.char).setFormat(textNode.getFormat())
    textNode.replace(emojiNode)
    $getEditor().dispatchCommand(EMOJI_USED_COMMAND, emoji.name)
    return emojiNode
  },
  trigger: ':',
  type: 'text-match',
}

// Order matters: check lists before bullet lists, mentions before links, inline code first.
export const MARKDOWN_TRANSFORMERS: Transformer[] = [
  HEADING,
  QUOTE,
  CHECK_LIST,
  UNORDERED_LIST,
  ORDERED_LIST,
  CODE,
  INLINE_CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  MENTION,
  HARD_LINE_BREAK,
  EMOJI_SHORTCODE,
  LINK,
]
