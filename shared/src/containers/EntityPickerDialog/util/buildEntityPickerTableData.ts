import { FolderListItem, SearchEntityLink } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { getEntityTypeIcon } from '@shared/util'

export type EntityAnatomy = {
  name: string
  icon?: string
  color?: string
}

type Anatomy = {
  folderTypes: EntityAnatomy[]
  productTypes: EntityAnatomy[]
  taskTypes: EntityAnatomy[]
}

export const buildEntityPickerTableData = (
  data: SearchEntityLink[],
  anatomy?: Anatomy,
): SimpleTableRow[] => {
  return data.map((entity) => {
    const subTypeKey = (entity.entityType + 'Type') as keyof typeof entity
    const subType = entity[subTypeKey] as string | undefined

    // Get anatomy array based on entity type
    let anatomies: EntityAnatomy[] = []
    if (entity.entityType === 'folder' && anatomy?.folderTypes) {
      anatomies = anatomy.folderTypes
    } else if (entity.entityType === 'task' && anatomy?.taskTypes) {
      anatomies = anatomy.taskTypes
    } else if (entity.entityType === 'product' && anatomy?.productTypes) {
      anatomies = anatomy.productTypes
    }

    const foundAnatomy = anatomies.find((a) => a.name === subType)

    return {
      id: entity.id,
      name: entity.name,
      label: entity.label || entity.name,
      parents: entity.parents,
      icon: foundAnatomy?.icon || getEntityTypeIcon(entity.entityType),
      iconColor: foundAnatomy?.color,
      subRows: [],
      data: {
        id: entity.id,
        name: entity.name,
        label: entity.label || entity.name,
        entityType: entity.entityType,
      },
    }
  })
}

export const buildFolderPickerTableData = (
  data: FolderListItem[],
  anatomies: EntityAnatomy[],
): SimpleTableRow[] => {
  return data.map((folder) => {
    const foundAnatomy = anatomies.find((a) => a.name === folder.folderType)

    return {
      id: folder.id,
      name: folder.name,
      label: folder.label || folder.name,
      path: '/' + folder.path,
      icon: foundAnatomy?.icon || getEntityTypeIcon('folder'),
      iconColor: foundAnatomy?.color,
      subRows: [],
      data: {
        id: folder.id,
        name: folder.name,
        label: folder.label || folder.name,
        folderType: folder.folderType,
        entityType: 'folder',
      },
    }
  })
}
