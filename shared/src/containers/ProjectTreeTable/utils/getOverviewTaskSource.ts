export type OverviewTaskSource =
  | 'tasksList' // paginated GetTasksList
  | 'expandedFolders' // GetTasksByParent for expanded folders
  | 'expandedFoldersAndTasksList' // hierarchy with slicer folders: their direct tasks come from GetTasksList
  | 'groups' // GetTasksList per expanded group

type Args = {
  showHierarchy: boolean
  isFlatFolderView: boolean
  isGrouped: boolean
  // slicer hierarchy folders are scope roots, not rows (false when a list panel drives the slicer)
  excludeSelectedFolders: boolean
  hasSelectedFolders: boolean
  hasTaskIds: boolean
  isLoadingViews: boolean
}

export const getOverviewTaskSource = ({
  showHierarchy,
  isFlatFolderView,
  isGrouped,
  excludeSelectedFolders,
  hasSelectedFolders,
  hasTaskIds,
  isLoadingViews,
}: Args) => {
  const tasksUnderSelectedFolders = showHierarchy && excludeSelectedFolders && hasSelectedFolders

  let source: OverviewTaskSource
  if (hasTaskIds) source = 'tasksList'
  else if (isFlatFolderView) source = 'expandedFolders'
  else if (showHierarchy)
    source = tasksUnderSelectedFolders ? 'expandedFoldersAndTasksList' : 'expandedFolders'
  else if (isGrouped) source = 'groups'
  else source = 'tasksList'

  const usesTasksList = source === 'tasksList' || source === 'expandedFoldersAndTasksList'

  return {
    source,
    tasksUnderSelectedFolders,
    skipTasksList: isLoadingViews || !usesTasksList,
  }
}
