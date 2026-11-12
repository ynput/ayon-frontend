import type { EntityRef } from '@ynput/ayon-addon'
import type { PickedEntity, PickerSelection } from '@shared/containers/EntityPickerDialog'
import { entityHierarchies } from '../../containers/EntityPickerDialog/util/entityHierarchies'

// The addon EntityPicker's initial selection as the picker's selection per entity type. Refs of a
// type the picker doesn't have are ignored.
export const toPickerSelection = (
  refs: Pick<EntityRef, 'id' | 'entityType'>[] = [],
): Partial<PickerSelection> => {
  const selection: Partial<PickerSelection> = {}
  for (const { id, entityType } of refs) {
    if (!(entityType in entityHierarchies)) continue
    const type = entityType as keyof PickerSelection
    selection[type] = { ...selection[type], [id]: true }
  }
  return selection
}

// What the picker returns (the ids and the entities it loaded) as the EntityRefs addons get.
export const toEntityRefs = (
  ids: string[],
  entities: PickedEntity[],
  entityType: string,
  projectName: string,
): EntityRef[] =>
  ids.map((id, i) => {
    const entity = entities[i]
    return {
      id,
      entityType,
      projectName,
      ...(entity?.name && { name: entity.name }),
      ...(entity?.label && { label: entity.label }),
    }
  })
