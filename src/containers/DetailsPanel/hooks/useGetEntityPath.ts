import { useGetFolderListQuery } from '@queries/getHierarchy'
import { PathSegment } from '@components/EntityPath/EntityPath'
import { $Any } from '@types'
import { useMemo } from 'react'
import getEntityPathData from '../helpers/getEntityPathData'

type Props = {
  entity: $Any
  projectName: string
  isLoading: boolean
}

const useGetEntityPath = ({ entity, projectName, isLoading }: Props): PathSegment[] => {
  // get the folders list for the project
  const { data: { folders: projectFolders = [] } = {}, isFetching } = useGetFolderListQuery(
    { projectName: projectName },
    { skip: !projectName || isLoading },
  )

  const foldersMap = useMemo(
    () => new Map(projectFolders.map((folder) => [folder.id, folder])),
    [projectFolders],
  )

  const segments = useMemo(
    () => (isFetching ? [] : getEntityPathData(entity, foldersMap)),
    [projectFolders, entity],
  )

  return segments
}

export default useGetEntityPath
