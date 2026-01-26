import { getEntityTypeIcon } from '@shared/util/getEntityTypeIcon'
import { Anatomy } from '@shared/api'

export type IconAnatomy = Pick<Anatomy, 'folder_types' | 'task_types' | 'product_base_types'>

export const getEntityIcon = (
  entityType: string,
  subType: string | undefined,
  anatomy: IconAnatomy,
): string => {
  switch (entityType) {
    case 'folder':
      return (
        anatomy.folder_types?.find((a) => a.name === subType)?.icon || getEntityTypeIcon('folder')
      )
    case 'product':
      return (
        anatomy.product_base_types?.definitions?.find((a) => a.name === subType)?.icon ||
        anatomy.product_base_types?.default?.icon ||
        getEntityTypeIcon('product')
      )
    case 'task':
      return (
        anatomy.task_types?.find((a) => a.name === subType)?.icon || getEntityTypeIcon('task')
      )
    default:
      return getEntityTypeIcon(entityType)
  }
}

export const getEntityColor = (
  entityType: string,
  subType: string | undefined,
  anatomy: IconAnatomy,
): string | undefined => {
  switch (entityType) {
    case 'folder':
      return anatomy.folder_types?.find((a) => a.name === subType)?.color
    case 'task':
      return anatomy.task_types?.find((a) => a.name === subType)?.color
    case 'product':
      return (
        anatomy.product_base_types?.definitions?.find((a) => a.name === subType)?.color ||
        anatomy.product_base_types?.default?.color
      )
    default:
      return undefined
  }
}
