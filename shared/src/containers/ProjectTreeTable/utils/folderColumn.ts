import type { EntityData, TableRow } from '../types/table'

// The folder shown in the Folder column. Normally that is the row's parent folder.
// In the flat folder view ("Group by: Folder") the folder rows are the groups, so
// they show themselves: the same folder their task rows show.
export const getFolderColumnEntity = (
  row: TableRow,
  isFlatFolderView = false,
): EntityData | undefined => {
  if (row.group || row.metaType) return undefined
  if (row.parents?.folder) return row.parents.folder
  if (isFlatFolderView && row.primary.entityType === 'folder') return row.primary
  return undefined
}

export const getFolderColumnValue = (
  row: TableRow,
  isFlatFolderView = false,
): string | undefined => {
  const folder = getFolderColumnEntity(row, isFlatFolderView)
  return folder?.label || folder?.name
}
