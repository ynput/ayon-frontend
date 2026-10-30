import { getHost } from './hostBridge'
import { Missing } from './layout'
import type { EntityRef } from './scopes'

/** What `EntityPicker` picks. */
export type PickableEntityType = 'folder' | 'task' | 'product' | 'version' | 'representation' | 'workfile'

export interface EntityPickerProps {
  /** the project to pick from */
  projectName: string
  /**
   * What to pick. The picker also shows the types above it to narrow the list down, e.g. folders
   * then tasks for `task`, folders, products then versions for `version`.
   */
  entityType: PickableEntityType
  /** let the user pick several; one by default */
  multiSelect?: boolean
  /**
   * Selected when the picker opens: entities of `entityType`, or of a type above it to narrow the
   * list (a folder opens the folder tree at it). `EntityRef`s from a slot context fit as they are.
   */
  initialSelection?: Pick<EntityRef, 'id' | 'entityType'>[]
  /**
   * The picked entities, of `entityType` in this project. `name` and `label` are set when the
   * picker has loaded them. The picker stays open until you stop rendering it: close it here.
   */
  onSubmit: (entities: EntityRef[]) => void
  /** the user closed the picker without picking (its close button or Escape) */
  onClose: () => void
}

/**
 * AYON's entity picker, the dialog AYON uses to link, move or pick entities. It loads the project
 * and its folders itself, so it works anywhere: a header item, a popover, a studio page, a details
 * panel tab. Render it while it should be open.
 *
 * ```tsx
 * {picking && (
 *   <EntityPicker
 *     projectName={projectName}
 *     entityType="task"
 *     onClose={() => setPicking(false)}
 *     onSubmit={([task]) => {
 *       setPicking(false)
 *       setTask(task) // { id, entityType: 'task', projectName, name, label }
 *     }}
 *   />
 * )}
 * ```
 */
export const EntityPicker = (props: EntityPickerProps) => {
  const Host = getHost().components?.EntityPicker
  return Host ? <Host {...props} /> : <Missing name="EntityPicker" />
}
