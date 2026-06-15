import { EntityComment } from '@shared/api'
import { allowedRefTypes } from '@shared/containers/Feed/components/ActivityComment/ActivityMarkdownComponents'

const pad = (n: number) => String(n).padStart(2, '0')

// DD/MM/YYYY HH:mm — the format requested for spreadsheet export.
const formatCommentDate = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

const decodeEntities = (s: string): string =>
  s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')

// Strip the comment markdown down to the plain text the table widget actually shows: mentions
// (`[label](user:...)`) become their label, lists/headings/code/emphasis lose their markers,
// images and raw HTML are dropped, and everything collapses onto a single line.
const bodyToPlainText = (body?: string | null): string => {
  if (!body) return ''
  let t = body
  t = t.replace(/<br\s*\/?>/gi, ' ') // explicit line breaks
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images -> nothing (widget renders img as null)
  // links & mentions -> label; mentions (`type:id`) drop the leading @, matching the widget
  t = t.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_m, label, target) =>
    allowedRefTypes.includes(String(target).split(':')[0]) ? String(label).replace(/^@/, '') : label,
  )
  t = t.replace(/```([\s\S]*?)```/g, '$1') // fenced code -> its contents
  t = t.replace(/`+/g, '') // inline code ticks
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, '') // ATX headings
  t = t.replace(/^\s*[-=]{2,}\s*$/gm, '') // setext heading underlines
  t = t.replace(/^\s*>\s?/gm, '') // blockquotes
  t = t.replace(/^\s*[-*+]\s+\[[ xX]\]\s?/gm, '') // task-list markers
  t = t.replace(/^\s*[-*+]\s+/gm, '') // bullet markers
  t = t.replace(/^\s*\d+\.\s+/gm, '') // ordered-list markers
  t = t.replace(/\*\*|__|~~/g, '') // bold / strikethrough
  t = decodeEntities(t)
  t = t.replace(/<[^>]+>/g, '') // any leftover html tags
  return t.replace(/\s+/g, ' ').trim()
}

/**
 * Convert latest comments to clipboard text, newest first, one comment per line:
 * `{body} - {author} - {DD/MM/YYYY HH:mm}`
 */
export const commentsToText = (comments: EntityComment[] = []): string =>
  comments
    .map((c) =>
      [bodyToPlainText(c.body), c.author, formatCommentDate(c.createdAt)].filter(Boolean).join(' - '),
    )
    .join('\n')
