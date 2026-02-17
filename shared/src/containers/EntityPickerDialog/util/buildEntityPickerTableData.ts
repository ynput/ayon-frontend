import { FolderListItem, SearchEntityLink } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { getEntityTypeIcon } from '@shared/util'

export type EntityAnatomy = {
  name: string
  icon?: string
  color?: string
}

export const buildEntityPickerTableData = (
  data: SearchEntityLink[],
  anatomies?: EntityAnatomy[],
): SimpleTableRow[] => {
  return data.map((entity) => {
    const anatomy = anatomies?.find((a) => a.name === entity.subType)
    return {
      id: entity.id,
      name: entity.name,
      label: entity.label || entity.name,
      parents: entity.parents,
      icon: anatomy?.icon || getEntityTypeIcon(entity.entityType),
      iconColor: anatomy?.color,
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
    const anatomy = anatomies.find((a) => a.name === folder.folderType)
    return {
      id: folder.id,
      name: folder.name,
      label: folder.label || folder.name,
      path: '/' + folder.path,
      icon: anatomy?.icon || getEntityTypeIcon('folder'),
      iconColor: anatomy?.color,
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
