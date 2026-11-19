import { getHost } from './hostBridge'
import { Missing } from './layout'

/** What `ListPicker` shows: lists (`generic`) and review sessions (`review-session`). */
export type PickableEntityListType = 'generic' | 'review-session'

/** An entity list as `ListPicker` returns it: a list or a review session of the project. */
export interface EntityListRef {
  /** the list's id (a uuid without dashes) */
  id: string
  projectName: string
  label: string
  /** `generic` for a list, `review-session` for a review session */
  entityListType: string
  /** the type of the list's items: `folder`, `task`, `product`, `version`, ... */
  entityType: string
  /** how many items the list has */
  count: number
}

export interface ListPickerProps {
  /** the project to pick from */
  projectName: string
  /** the kinds of lists to show; lists and review sessions by default */
  entityListTypes?: PickableEntityListType[]
  /** let the user pick several; one by default */
  multiSelect?: boolean
  /** selected when the picker opens, the first one scrolled to */
  initialSelection?: Pick<EntityListRef, 'id'>[]
  /**
   * The picked lists. The picker stays open until you stop rendering it: close it here.
   */
  onSubmit: (lists: EntityListRef[]) => void
  /** the user closed the picker without picking (its close button, Cancel or Escape) */
  onClose: () => void
}

/**
 * AYON's list picker, the dialog AYON uses to pick lists and review sessions (Add to list, compare
 * with list): the project's lists in their folders, with search, sorting and item counts. It loads
 * the project itself, so it works anywhere. Render it while it should be open.
 *
 * ```tsx
 * {picking && (
 *   <ListPicker
 *     projectName={projectName}
 *     onClose={() => setPicking(false)}
 *     onSubmit={([list]) => {
 *       setPicking(false)
 *       setList(list) // { id, projectName, label, entityListType, entityType, count }
 *     }}
 *   />
 * )}
 * ```
 */
export const ListPicker = (props: ListPickerProps) => {
  const Host = getHost().components?.ListPicker
  return Host ? <Host {...props} /> : <Missing name="ListPicker" />
}
