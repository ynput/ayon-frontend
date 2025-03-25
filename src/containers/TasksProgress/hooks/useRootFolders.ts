// gets the root folders for the project
//  this is used when the slice type is not hierarchy
// and we need to get all the tasks for the project

import { SliceType } from '@context/slicerContext'
import { useGetFolderListQuery } from '@queries/getHierarchy'
import { useMemo } from 'react'

type Props = {
  sliceType: SliceType
  projectName: string
}

export const useRootFolders = ({ sliceType, projectName }: Props): string[] => {
  const { data: { folders = [] } = {} } = useGetFolderListQuery(
    { projectName: projectName || '' },
    { skip: !projectName || sliceType === 'hierarchy' },
  )

  const rootFolders = useMemo(() => folders.filter((folder) => folder.parentId === null), [folders])
  const rootFolderIds = useMemo(() => rootFolders.map((folder) => folder.id), [rootFolders])

  return rootFolderIds
}
