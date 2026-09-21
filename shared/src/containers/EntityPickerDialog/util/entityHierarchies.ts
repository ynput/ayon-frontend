import { PickerEntityType } from '../EntityPickerDialog'

// Defines the complete hierarchy chain for each entity type
// The hierarchy is ordered from root to the target entity
export type EntityHierarchies = Record<PickerEntityType, PickerEntityType[]>
export const entityHierarchies: EntityHierarchies = {
  folder: ['folder'],
  product: ['folder', 'product'],
  version: ['folder', 'product', 'version'],
  representation: ['folder', 'product', 'version', 'representation'],
  task: ['folder', 'task'],
  workfile: ['folder', 'task', 'workfile'],
}

// the entity types the reviewables switch filters server side
export const isReviewableEntity = (
  entityType: PickerEntityType,
): entityType is 'product' | 'version' =>
  entityType === 'product' || entityType === 'version'
