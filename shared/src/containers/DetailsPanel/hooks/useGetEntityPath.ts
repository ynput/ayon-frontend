import { useMemo } from 'react'
import getEntityPathData from '../helpers/getEntityPathData'
// shared
import { PathSegment } from '@shared/components'
import { useGetProductVersionsQuery, useGetFolderListQuery } from '@shared/api'
import type { DetailsPanelEntityData, DetailsPanelEntityType } from '@shared/api'

type Props = {
  entity: DetailsPanelEntityData
  entityType: DetailsPanelEntityType
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
    { projectName: projectName, attrib: true },
    { skip: !projectName || isLoading },
  )

  // if the entityType is version, get sibling versions
  const { data: versionsData } = useGetProductVersionsQuery(
    { productId: entity.product?.id || '', projectName },
    { skip: entityType !== 'version' || !entity.product?.id },
  )

  const versions = useMemo(
    () =>
      !versionsData?.project.product?.versionList
        ? []
        : [...(versionsData.project.product?.versionList || [])]
            .sort((a, b) => {
              if (a.name === 'HERO') return -1
              if (b.name === 'HERO') return 1
              return b.name.localeCompare(a.name)
            })
            .map((version) => ({
              type: 'version' as const,
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
