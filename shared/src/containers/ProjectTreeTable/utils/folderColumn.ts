import type { EntityData, TableRow } from '../types/table'

// The folder shown in the Folder column. Normally that is the row's parent folder.
// Folder rows of the hierarchy and flat folder ("Group by: Folder") views have no
// parent on the row, so they show themselves: the same folder their task rows show.
export const getFolderColumnEntity = (row: TableRow): EntityData | undefined => {
  if (row.group || row.metaType) return undefined
  if (row.parents?.folder) return row.parents.folder
  // loading placeholder rows are typed as folders
  if (row.primary.entityType === 'folder' && !row.isLoading) return row.primary
  return undefined
}

export const getFolderColumnValue = (row: TableRow): string | undefined => {
  const folder = getFolderColumnEntity(row)
  return folder?.label || folder?.name
}
