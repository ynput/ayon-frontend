import { useGetEntityGroupsQuery } from '@shared/api'
import { TableGroupBy } from '../context'

type GetTaskGroupsProps = {
  groupBy?: TableGroupBy
  projectName: string
}

export const useGetTaskGroups = ({ groupBy, projectName }: GetTaskGroupsProps) => {
  // GROUPING
  // 1. get groups data
  // 2. add that filter to the combined filter
  // 3. sort by that filter
  const groupingKey = groupBy?.id || ''
  const { data: { groups: taskGroups = [] } = {}, error } = useGetEntityGroupsQuery(
    { projectName, entityType: 'task', groupingKey: groupingKey, empty: true },
    { skip: !groupBy?.id },
  )

  return {
    taskGroups,
    error,
  }
}
