import { useGetEntityGroupsQuery } from '@shared/api'
import { TableGroupBy } from '../containers/ProjectTreeTable/context'

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
  // GROUPING
  // 1. get groups data
  // 2. add that filter to the combined filter
  // 3. sort by that filter
  // 'folder' is taken by the overview flat folder view, so versions group by 'folderId'
  const groupingKey = groupBy?.id === 'folderId' ? 'folder' : groupBy?.id || ''
  const {
    data: { groups = [] } = {},
    currentData,
    isFetching,
    error,
  } = useGetEntityGroupsQuery(
    { projectName, entityType, groupingKey: groupingKey, empty: true },
    { skip: !groupBy?.id },
  )
  return {
    groups,
    error,
    // data still holds the previous key's groups while the new ones load
    isLoading: isFetching && !currentData,
  }
}
