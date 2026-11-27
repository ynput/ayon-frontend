import { useSyncExternalStore } from 'react'
import { isEqual } from 'lodash'
import { reorderTabs, toggleTabHidden } from './applyLayout'
import type { LayoutSettings } from './types'

export interface LayoutEdit {
  /** the layout's name as editing began */
  name: string
  /**
   * What Save calls it: its name, or the name of the copy Save makes when the user can't change
   * it; the user may rename it meanwhile
   */
  label: string
  /** that name as editing began */
  initialLabel: string
  /** its settings as editing began */
  initial: LayoutSettings
  /** its settings with the changes made so far */
  draft: LayoutSettings
  /** Save is under way: the draft stays as it was sent */
  saving: boolean
  /** the layout Save writes into; none when Save makes the user's own copy */
  layoutId?: string
  /** the user owns that layout: they may share it */
  owned: boolean
  /**
   * Saves a change (and a new name) into the layout being edited, or the user's copy of it when
   * they can't change it: the layout that applied where editing began, wherever the user is when
   * they save.
   */
  save: (
    change: (layout: LayoutSettings | undefined) => LayoutSettings,
    label?: string,
  ) => Promise<string>
  /** deletes a layout the user owns, and stops following it when it was their pick */
  remove: (layoutId: string) => Promise<void>
}

// One edit at a time for the whole app: the sidebar, the tab rows and the editing panel show it.
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
  layout,
  label,
  ...rest
}: Pick<LayoutEdit, 'name' | 'layoutId' | 'owned' | 'save' | 'remove'> & {
  label: string
  layout?: LayoutSettings
}) => {
  const initial = layout ?? { version: 1 }
  set({ ...rest, label, initialLabel: label, initial, draft: initial, saving: false })
}

export const changeDraft = (change: (draft: LayoutSettings) => LayoutSettings) => {
  if (edit && !edit.saving) set({ ...edit, draft: change(edit.draft) })
}

/** What Save will call the layout. */
export const renameEdit = (label: string) => {
  if (edit && !edit.saving) set({ ...edit, label })
}

/** The layout was renamed meanwhile (in its sharing dialog): that is its name now. */
export const layoutRenamed = (label: string) => {
  if (edit) set({ ...edit, name: label, label, initialLabel: label })
}

/** Something about the edit changed: the sidebar, a tab row, a pin, an option or the name. */
export const isEditChanged = (current: LayoutEdit) =>
  !isEqual(current.initial, current.draft) || current.label.trim() !== current.initialLabel

/** Saves the draft, once: changes wait meanwhile, and editing ends when it is saved. */
export const saveEdit = async (
  apply: (current: LayoutSettings | undefined, draft: LayoutSettings) => LayoutSettings,
) => {
  const current = edit
  if (!current || current.saving) return
  // nothing replaces it while it saves (changes wait, Cancel and Customize are off)
  const saving = { ...current, saving: true }
  set(saving)
  try {
    // a new name, when it has one
    const label = current.label.trim()
    await current.save(
      (layout) => apply(layout, current.draft),
      label && label !== current.initialLabel ? label : undefined,
    )
    if (edit === saving) set(null)
  } catch (error) {
    if (edit === saving) set({ ...saving, saving: false })
    throw error
  }
}

export const stopEditing = () => set(null)

/**
 * After a drag ends, the click the browser then sends to what is under the pointer opens nothing:
 * a dragged tab or sidebar item is a link.
 */
export const swallowNextClick = () => {
  const stop = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }
  window.addEventListener('click', stop, { capture: true, once: true })
  // the click comes with the pointer's release, before any timer
  setTimeout(() => window.removeEventListener('click', stop, { capture: true }))
}

/** The layout being edited, if any, outside React. */
export const getLayoutEdit = () => edit

/** The layout being edited, if any. */
export const useLayoutEdit = () => useSyncExternalStore(subscribe, () => edit)

/**
 * A tab row's controls while a layout is being edited: which tabs it hides, hiding or showing one,
 * and dropping one where another is (`rowIds`, the row's tab ids as shown).
 */
export interface TabRowEdit {
  hidden: string[]
  toggle: (id: string) => void
  reorder: (rowIds: string[], id: string, overId: string) => void
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
    reorder: (rowIds, id, overId) =>
      changeDraft((draft) => reorderTabs(draft, context, itemId, rowIds, id, overId)),
  }
}
