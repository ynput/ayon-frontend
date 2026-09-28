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
  type ElementTransformer,
  type TextMatchTransformer,
  type Transformer,
} from '@lexical/markdown'
import { $createTextNode, $getEditor, $isLineBreakNode, LineBreakNode, TextNode } from 'lexical'
import { EMOJI_USED_COMMAND } from '../emoji/commands'
import { getEmoji } from '../emoji/emojiData'
import { $createMentionNode, $isMentionNode, MentionNode } from '../nodes/MentionNode'
import { $createYouTubeNode, $isYouTubeNode, YouTubeNode } from '../nodes/YouTubeNode'
import { $createMediaNode, $isMediaNode, MediaNode } from '../nodes/MediaNode'
import { parseYouTubeUrl } from '../youtube/parseYouTubeUrl'
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

// A line that is only a YouTube url is an embedded video. Only on import, a url typed or pasted
// in the editor is turned into a video by YouTubePlugin.
export const YOUTUBE: ElementTransformer = {
  dependencies: [YouTubeNode],
  export: (node) => ($isYouTubeNode(node) ? node.getUrl() : null),
  regExp: /^\s*(https?:\/\/\S+)\s*$/,
  replace: (parentNode, _children, match, isImport) => {
    if (!isImport || !parseYouTubeUrl(match[1])) return false
    parentNode.replace($createYouTubeNode(match[1]))
  },
  type: 'element',
}

// An image on its own line is an image or video block, the title holds the mime type:
// `![clip.mp4](/api/projects/p/files/id "video/mp4")`. Images inside text stay text.
export const MEDIA: ElementTransformer = {
  dependencies: [MediaNode],
  export: (node) => {
    if (!$isMediaNode(node)) return null
    // not stored until the upload finishes
    if (node.isUploading()) return ''
    const alt = node.getAlt().replace(/[[\]]/g, '')
    const mime = node.getMime()
    return `![${alt}](${node.getSrc()}${mime ? ` "${mime.replace(/"/g, '')}"` : ''})`
  },
  regExp: /^\s*!\[([^\]]*)\]\(<?([^\s)>]+)>?(?:\s+"([^"]*)")?\)\s*$/,
  replace: (parentNode, _children, match, isImport) => {
    if (!isImport) return false
    const [, alt, src, mime] = match
    parentNode.replace($createMediaNode({ src, alt, mime: mime || null }))
  },
  type: 'element',
}

// Order matters: check lists before bullet lists, mentions before links, inline code first.
export const MARKDOWN_TRANSFORMERS: Transformer[] = [
  YOUTUBE,
  MEDIA,
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
