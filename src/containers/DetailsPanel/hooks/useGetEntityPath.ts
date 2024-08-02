import { useGetFolderListQuery } from '@queries/getHierarchy'
import { PathSegment } from '@components/EntityPath/EntityPath'
import { $Any } from '@types'
import { useMemo } from 'react'
import getEntityPathData from '../helpers/getEntityPathData'
import { useGetProductVersionsQuery } from '@queries/entity/getEntity'

type Props = {
  entity: $Any
  entityType: string
  projectName: string
  isLoading: boolean
}

const useGetEntityPath = ({
  entity,
  entityType,
  projectName,
  isLoading,
}: Props): [PathSegment[], PathSegment[]] => {
  // get the folders list for the project
  const { data: { folders: projectFolders = [] } = {}, isFetching } = useGetFolderListQuery(
    { projectName: projectName },
    { skip: !projectName || isLoading },
  )

  // if the entityType is version, get sibling versions
  const { data: versionsData } = useGetProductVersionsQuery(
    { productId: entity.productId, projectName },
    { skip: entityType !== 'version' || !entity.productId },
  )

  const versions = useMemo(
    () =>
      !versionsData
        ? []
        : [...versionsData.project.product.versionList]
            .sort((a, b) => {
              if (a.name === 'HERO') return -1
              if (b.name === 'HERO') return 1
              return b.name.localeCompare(a.name)
            })
            .map((version) => ({
              type: 'version',
              label: version.name,
              id: version.id,
            })),
    [versionsData],
  )

  const foldersMap = useMemo(
    () => new Map(projectFolders.map((folder) => [folder.id, folder])),
    [projectFolders],
  )

  const segments = useMemo(
    () => (isFetching ? [] : getEntityPathData(entity, foldersMap)),
    [projectFolders, entity],
  )

  return [segments, versions]
}

export default useGetEntityPath
