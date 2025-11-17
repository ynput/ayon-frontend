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
  const groupingKey = groupBy?.id || ''
  const { data: { groups = [] } = {}, error } = useGetEntityGroupsQuery(
    { projectName, entityType, groupingKey: groupingKey, empty: true },
    { skip: !groupBy?.id },
  )

  return {
    groups,
    error,
  }
}
