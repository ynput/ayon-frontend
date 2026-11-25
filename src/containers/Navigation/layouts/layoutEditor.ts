import { useSyncExternalStore } from 'react'
import { toggleTabHidden } from './applyLayout'
import type { LayoutSettings } from './types'

export interface LayoutEdit {
  /** the layout's name, for the editing bar */
  name: string
  /** its settings as editing began */
  initial: LayoutSettings
  /** its settings with the changes made so far */
  draft: LayoutSettings
  /**
   * Saves a change into the layout being edited, or the user's copy of it when they can't change
   * it: the layout that applied where editing began, wherever the user is when they save.
   */
  save: (change: (layout: LayoutSettings | undefined) => LayoutSettings) => Promise<string>
}

// One edit at a time for the whole app: the sidebar, the tab rows and the editing bar show it.
let edit: LayoutEdit | null = null
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const set = (next: LayoutEdit | null) => {
  edit = next
  listeners.forEach((listener) => listener())
}

export const startEditing = ({
  name,
  layout,
  save,
}: Pick<LayoutEdit, 'name' | 'save'> & { layout?: LayoutSettings }) => {
  const initial = layout ?? { version: 1 }
  set({ name, initial, draft: initial, save })
}

export const changeDraft = (change: (draft: LayoutSettings) => LayoutSettings) => {
  if (edit) set({ ...edit, draft: change(edit.draft) })
}

export const stopEditing = () => set(null)

/** The layout being edited, if any. */
export const useLayoutEdit = () => useSyncExternalStore(subscribe, () => edit)

/** A tab row's controls while a layout is being edited: which tabs it hides, and hiding one. */
export interface TabRowEdit {
  hidden: string[]
  toggle: (id: string) => void
}

/** The controls for an item's tab row while a layout is being edited; none otherwise. */
export const useTabRowEdit = (
  context: 'project' | 'studio',
  itemId: string,
): TabRowEdit | undefined => {
  const current = useLayoutEdit()
  if (!current) return undefined
  return {
    hidden: current.draft[context]?.tabs?.[itemId]?.hidden ?? [],
    toggle: (id) => changeDraft((draft) => toggleTabHidden(draft, context, itemId, id)),
  }
}
