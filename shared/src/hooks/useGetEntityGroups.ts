import { useGetEntityGroupsQuery } from '@shared/api'
import { TableGroupBy } from '../containers/ProjectTreeTable/context'
import { useFolderGroups } from './useFolderGroups'

type GetEntityGroupsProps = {
  groupBy?: TableGroupBy
  projectName: string
  entityType: string
}

export const useGetEntityGroups = ({ groupBy, projectName, entityType }: GetEntityGroupsProps) => {
  // if groupBy is taskType always use entityType 'task'
  if (groupBy?.id === 'taskType') {
    entityType = 'task'
  }
  // 'folder' is taken by the overview flat folder view, so versions group by 'folderId'
  const isFolderGrouping = groupBy?.id === 'folderId'
  const folderGroups = useFolderGroups(entityType, isFolderGrouping)

  // GROUPING
  // 1. get groups data
  // 2. add that filter to the combined filter
  // 3. sort by that filter
  const {
    data: { groups = [] } = {},
    currentData,
    isFetching,
    error,
  } = useGetEntityGroupsQuery(
    { projectName, entityType, groupingKey: groupBy?.id || '', empty: true },
    { skip: !groupBy?.id || isFolderGrouping },
  )

  if (isFolderGrouping) return { ...folderGroups, error: undefined }

  return {
    groups,
    error,
    // data still holds the previous key's groups while the new ones load
    isLoading: isFetching && !currentData,
  }
}
