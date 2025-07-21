import { FolderListItem, SearchEntityLink } from '@shared/api'
import { SimpleTableRow } from '@shared/SimpleTable'

export const buildEntityPickerTableData = (data: SearchEntityLink[]): SimpleTableRow[] => {
  return data.map((entity) => ({
    id: entity.id,
    name: entity.name,
    label: entity.label || entity.name,
    path: entity.path,
    subRows: [],
    data: {
      id: entity.id,
      name: entity.name,
      label: entity.label || entity.name,
      entityType: entity.entityType,
    },
  }))
}

export const buildFolderPickerTableData = (data: FolderListItem[]): SimpleTableRow[] => {
  return data.map((folder) => ({
    id: folder.id,
    name: folder.name,
    label: folder.label || folder.name,
    path: folder.path,
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
