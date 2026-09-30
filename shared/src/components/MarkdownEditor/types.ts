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

// Which trigger is shown in front of a mention of each type
export const MENTION_TRIGGER_BY_TYPE: Record<string, MentionTrigger> = {
  user: '@',
  team: '@',
  version: '@@',
  task: '@@@',
}

export const getMentionTrigger = (type: string): MentionTrigger =>
  MENTION_TRIGGER_BY_TYPE[type] ?? '@'

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
  // users are shown with a round avatar, entities with a square icon
  isCircle?: boolean
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

// shown over the selected text
export const FLOATING_TOOLBAR: ToolbarLayout = [
  'bold',
  'italic',
  'strikethrough',
  'link',
  '|',
  'quote',
]

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
