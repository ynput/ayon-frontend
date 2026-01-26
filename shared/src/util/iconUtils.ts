import { getEntityTypeIcon } from '@shared/util/getEntityTypeIcon'
import { Anatomy } from '@shared/api'

export type IconAnatomy = Pick<Anatomy, 'folder_types' | 'task_types' | 'product_base_types'>
const getAnatomyType = (
  entityType: string,
  subType: string | undefined,
  anatomy: IconAnatomy,
) => {
  switch (entityType) {
    case 'folder':
      return anatomy.folder_types?.find((a) => a.name === subType)
    case 'task':
      return anatomy.task_types?.find((a) => a.name === subType)
    case 'product':
      return (
        anatomy.product_base_types?.definitions?.find((a) => a.name === subType) ||
        anatomy.product_base_types?.default
      )
    default:
      return undefined
  }
}

export const getEntityIcon = (
  entityType: string,
  subType: string | undefined,
  anatomy: IconAnatomy,
): string => {
  return getAnatomyType(entityType, subType, anatomy)?.icon || getEntityTypeIcon(entityType)
}

export const getEntityColor = (
  entityType: string,
  subType: string | undefined,
  anatomy: IconAnatomy,
): string | undefined => {
  return getAnatomyType(entityType, subType, anatomy)?.color
}
