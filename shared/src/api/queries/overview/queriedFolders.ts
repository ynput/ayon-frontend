// --- TRACKING REGISTRY FOR EMPTY FOLDERS (FILTER-AWARE) ---
export const queriedFoldersRegistry: Record<string, Set<string>> = {}

export const getCacheKey = (
  projectName: string,
  filter?: string,
  folderFilter?: string,
  search?: string,
  showComments?: boolean,
) => {
  return JSON.stringify({ projectName, filter, folderFilter, search, showComments })
}

export const markFoldersAsQueried = (cacheKey: string, folderIds: string[]) => {
  if (!queriedFoldersRegistry[cacheKey]) {
    queriedFoldersRegistry[cacheKey] = new Set()
  }
  folderIds.forEach((id) => queriedFoldersRegistry[cacheKey].add(id))
}

export const getQueriedFolders = (cacheKey: string): Set<string> => {
  return queriedFoldersRegistry[cacheKey] || new Set()
}

// Empty folders count as covered too; task rows alone cannot tell us what was fetched.
export const hasUnqueriedFolders = (args: {
  projectName: string
  parentIds: string[]
  filter?: string
  folderFilter?: string
  search?: string
  showComments?: boolean
}) => {
  const { projectName, parentIds, filter, folderFilter, search, showComments } = args
  const covered = getQueriedFolders(
    getCacheKey(projectName, filter, folderFilter, search, showComments),
  )
  return parentIds.some((id) => !covered.has(id))
}
