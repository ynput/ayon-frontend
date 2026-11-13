// What Context asks for, per place of AYON (places.ts); a preview scene takes its own
// fields instead. And which slots are menus (a preview runs their item), for AYON's slots and
// other addons'.
import type { AnyContribution } from '@ynput/ayon-addon'
import type { ShellSelection } from './types'

export interface PlaceNeeds {
  project?: boolean
  /** the studio's project selection */
  projects?: boolean
  /** the entities the slots are about (the details panel, the table's rows) */
  entities?: boolean
  /** the project table page */
  tablePage?: boolean
  /** the user the user details panel shows */
  user?: boolean
}

const NEEDS: Record<string, PlaceNeeds> = {
  'project-pages': { project: true },
  slicer: { project: true, entities: true },
  'project-tables': { project: true, entities: true, tablePage: true },
  'details-panel': { project: true, entities: true },
  'studio-pages': { projects: true },
  'project-list': { projects: true },
  'user-details': { user: true },
}

export const placeNeeds = (place?: string): PlaceNeeds => (place && NEEDS[place]) || {}

/** The inputs the stage can't render without, missing in the selection. */
export const missingInputs = (place: string | undefined, selection: ShellSelection) => {
  const needs = placeNeeds(place)
  if (needs.project && !selection.projectName) return true
  // the table renders without rows (it says so); the details panel needs something to show
  return place === 'details-panel' && !selection.entities.length
}

const RUN: string[] = [
  'detailsPanel.menuItem',
  'projectList.menuItem',
  'slicer.menuItem',
  'entityMenuItem',
  'projectTable.columnMenuItem',
  'table.shortcut',
  'userDetails.menuItem',
]

export const isMenuSlot = (slot?: string) => !!slot && RUN.includes(slot)

/**
 * What a preview shows of a contribution to another addon's slot, from the pieces it has: its
 * component, its dialog's content, or a button that runs it. Undefined when it has none of them.
 */
export const declaredSlotPiece = (contribution: AnyContribution) =>
  (['component', 'dialog', 'run'] as const).find((piece) => typeof contribution[piece] === 'function')

export const ENTITY_TYPES = ['folder', 'task', 'product', 'version'] as const

/**
 * Why a contribution isn't shown with the current inputs, when the shell can tell: the entity
 * types it is for. Undefined when it shows (or the shell can't tell).
 */
export const hiddenReason = (contribution: AnyContribution, place: string | undefined, selection: ShellSelection) => {
  if (!placeNeeds(place).entities || !selection.entities.length) return undefined
  const { entityTypes } = contribution as { entityTypes?: string[] }
  const entityType = selection.entities[0]?.entityType || selection.entityType
  if (entityTypes?.length && entityType && !entityTypes.includes(entityType)) {
    return `It is for ${entityTypes.join(', ')}; the inputs are ${entityType}s.`
  }
  return undefined
}
