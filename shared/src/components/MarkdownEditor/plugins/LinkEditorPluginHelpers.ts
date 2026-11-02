import { createCommand, type LexicalCommand } from 'lexical'

// open the link editor for the link under the caret, or to link the selection
export const OPEN_LINK_EDITOR_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_LINK_EDITOR_COMMAND',
)

// ask for a YouTube url and embed the video at the caret (slash menu)
export const OPEN_VIDEO_PROMPT_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_VIDEO_PROMPT_COMMAND',
)

// accept urls without a scheme, e.g. ynput.io
export const normalizeUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
