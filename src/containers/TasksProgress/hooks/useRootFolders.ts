// gets the root folders for the project
//  this is used when the slice type is not hierarchy
// and we need to get all the tasks for the project

import { useMemo } from 'react'
import { useProjectFoldersContext } from '@shared/context'

export const useRootFolders = (): string[] => {
  const { folders } = useProjectFoldersContext()

  const rootFolders = useMemo(() => folders.filter((folder) => folder.parentId === null), [folders])
  const rootFolderIds = useMemo(() => rootFolders.map((folder) => folder.id), [rootFolders])

  return rootFolderIds
}
