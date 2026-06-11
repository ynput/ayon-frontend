import { useMemo } from 'react'
import getEntityPathData from '../helpers/getEntityPathData'
// shared
import { PathSegment } from '@shared/components'
import { useGetProductVersionsQuery, useGetFolderListQuery } from '@shared/api'
import type { DetailsPanelEntityData, DetailsPanelEntityType } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@shared/hooks'

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
  const { data: { folders: projectFolders = [] } = {}, isFetching: isFetchingRaw } =
    useGetFolderListQuery(
      // TODO: this is major overkill, we are only using label, name and id
      //  We add a patch field that allows us to specify what ws message changes should cause an update to this query
      // @ts-expect-error - patch is not part of the query args
      { projectName: projectName, patch: ['id', 'name', 'label'] },
      { skip: !projectName || isLoading },
    )

  const isFetching = useQueryArgumentChangeLoading(
    { projectName: projectName || '', isLoading },
    isFetchingRaw,
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
    [isFetching, projectFolders, entity],
  )

  return [segments, versions]
}

export default useGetEntityPath
