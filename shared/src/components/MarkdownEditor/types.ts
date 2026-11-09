import type { LexicalEditor } from 'lexical'
import type { ReactNode } from 'react'

// Trigger characters typed in the editor to open the mention picker
export type MentionTrigger = '@' | '@@' | '@@@'

// Entity types that can be referenced as `[label](type:id)` in markdown
export const MENTION_REF_TYPES = [
  'user',
  'team',
  'task',
  'version',
  'folder',
  'representation',
  'workfile',
  'product',
] as const
export type MentionRefType = (typeof MENTION_REF_TYPES)[number]

// where the mention picker opens
export type MentionPlacement = 'inline' | 'top'

export interface MentionItem {
  // entity type written to markdown, e.g. user, team, task, version
  type: string
  // entity id written to markdown, e.g. user name or task id
  id: string
  // label shown in the editor and written to markdown
  label: string
  icon?: string
  color?: string
  context?: string
  suffix?: string
}

// A quick filter chip shown in the picker header, e.g. users / teams for `@`
export interface MentionFilter {
  id: string
  icon: string
  tooltip: string
}

export interface MentionTriggerConfig {
  // shown in the picker header
  title: string
  // label used in the "No ... found" message
  noun: string
  filters?: MentionFilter[]
}

export interface MentionQuery {
  trigger: MentionTrigger
  search: string
  filter: string | null
}

export interface MentionSource {
  // triggers the picker responds to, defaults to all
  triggers?: MentionTrigger[]
  config?: Partial<Record<MentionTrigger, Partial<MentionTriggerConfig>>>
  getOptions: (query: MentionQuery) => MentionItem[]
  // search beyond the given options (e.g. the whole project), called debounced while typing,
  // the results are listed after the matching options
  search?: (query: MentionQuery) => Promise<MentionItem[]>
  // show a message instead of options (e.g. version mentions disabled for folders)
  getError?: (trigger: MentionTrigger) => string | null | undefined
  // limit of options shown at once
  limit?: number
  // optional custom renderer for the image part of an option
  renderOptionImage?: (option: MentionItem) => ReactNode
}

export interface MentionEventHandlers {
  onMentionClick?: (mention: { type: string; id: string; label: string }, e: MouseEvent) => void
  onMentionHover?: (
    mention: { type: string; id: string; label: string },
    target: HTMLElement,
  ) => void
}

export type ToolbarItem =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'code'
  | 'link'
  | 'codeBlock'
  | 'quote'
  | 'numberList'
  | 'bulletList'
  | 'checkList'

export type ToolbarLayout = (ToolbarItem | '|')[]

// headings, code blocks and inline code are in the slash menu
export const DEFAULT_TOOLBAR: ToolbarLayout = [
  'bold',
  'italic',
  'strikethrough',
  'link',
  '|',
  'quote',
  '|',
  'numberList',
  'bulletList',
  'checkList',
]

// descriptions have no check lists (those belong in comments)
export const DESCRIPTION_TOOLBAR: ToolbarLayout = [
  'h1',
  'h2',
  'h3',
  '|',
  'bold',
  'italic',
  'strikethrough',
  'link',
  '|',
  'codeBlock',
  'quote',
  '|',
  'numberList',
  'bulletList',
]

// shown over the selected text
export const FLOATING_TOOLBAR: ToolbarLayout = [
  'bold',
  'italic',
  'strikethrough',
  'link',
  '|',
  'quote',
]

// A `/` command added by the editor's user, e.g. link the comment to the current frame
export interface EditorCommand {
  id: string
  label: string
  icon: string
  // extra words to find it by
  keywords?: string[]
  // shown on the right, e.g. a shortcut or the current value
  hint?: string
  run: () => void
}

export interface MarkdownEditorHandle {
  // the lexical editor, e.g. to dispatch commands
  getEditor: () => LexicalEditor
  focus: () => void
  blur: () => void
  getMarkdown: () => string
  setMarkdown: (markdown: string) => void
  clear: () => void
  isEmpty: () => boolean
  // type a mention trigger at the caret and open the picker
  insertMentionTrigger: (trigger: MentionTrigger) => void
}
