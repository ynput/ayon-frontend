import { FolderListItem, SearchEntityLink } from '@shared/api'
import { SimpleTableRow } from '@shared/SimpleTable'
import { getEntityTypeIcon } from '@shared/util'

export type EntityAnatomy = {
  name: string
  icon?: string
}

export const buildEntityPickerTableData = (
  data: SearchEntityLink[],
  anatomies?: EntityAnatomy[],
): SimpleTableRow[] => {
  return data.map((entity) => ({
    id: entity.id,
    name: entity.name,
    label: entity.label || entity.name,
    parents: entity.parents,
    icon:
      anatomies?.find((a) => a.name === entity[(entity.entityType + 'Type') as keyof typeof entity])
        ?.icon || getEntityTypeIcon(entity.entityType),
    subRows: [],
    data: {
      id: entity.id,
      name: entity.name,
      label: entity.label || entity.name,
      entityType: entity.entityType,
    },
  }))
}

export const buildFolderPickerTableData = (
  data: FolderListItem[],
  anatomies: EntityAnatomy[],
): SimpleTableRow[] => {
  return data.map((folder) => ({
    id: folder.id,
    name: folder.name,
    label: folder.label || folder.name,
    path: '/' + folder.path,
    icon: anatomies.find((a) => a.name === folder.folderType)?.icon || getEntityTypeIcon('folder'),
    subRows: [],
    data: {
      id: folder.id,
      name: folder.name,
      label: folder.label || folder.name,
      folderType: folder.folderType,
      entityType: 'folder',
    },
  }))
}
