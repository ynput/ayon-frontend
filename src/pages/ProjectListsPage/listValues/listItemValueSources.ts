import { isEntityRestricted } from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'
import type { ListItemValueSources, ListValuesItem } from './types'

type ListItemLike = {
  id: string
  entityId: string
  entityType: string
  name?: string | null
  listAttrib?: Record<string, unknown>
  entityAttrib?: Record<string, unknown>
  ownAttrib?: string[]
}

export const getListItemValueSources = (
  item: Pick<ListItemLike, 'listAttrib' | 'entityAttrib' | 'ownAttrib'>,
): ListItemValueSources => ({
  listAttrib: item.listAttrib || {},
  entityAttrib: item.entityAttrib || {},
  entityOwnAttrib: item.ownAttrib || [],
})

// The item as the ListValues module gets it; restricted entities (no data) are left out
export const toListValuesItem = (item: ListItemLike): ListValuesItem | undefined =>
  isEntityRestricted(item.entityType) || !item.name
    ? undefined
    : {
        id: item.id,
        entityId: item.entityId,
        entityType: item.entityType,
        ...getListItemValueSources(item),
      }
