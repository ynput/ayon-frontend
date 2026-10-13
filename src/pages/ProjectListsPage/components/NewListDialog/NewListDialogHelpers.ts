import { getEntityTypeIcon } from '@shared/util'

export const listEntityTypes = ['folder', 'version', 'task'] as const
export type ListEntityType = (typeof listEntityTypes)[number]

export const entityTypeOptions = listEntityTypes.map((type) => ({
  label: type.charAt(0).toUpperCase() + type.slice(1),
  value: type,
  icon: getEntityTypeIcon(type),
}))
