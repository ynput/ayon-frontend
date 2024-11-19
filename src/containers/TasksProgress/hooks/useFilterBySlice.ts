// filters the tasks and folder rows by the slice type and slice value

import { GetTasksProgressResult } from '@queries/tasksProgress/getTasksProgress'
import filterTasksBySearch, { FolderTask, TaskFilterValue } from '../helpers/filterTasksBySearch'
import { useSlicerContext } from '@context/slicerContext'
import { useGetKanbanProjectUsersQuery } from '@queries/userDashboard/getUserDashboard'
import { useMemo } from 'react'

type Props = {
  folders: GetTasksProgressResult
  projectName: string
}

const useFilterBySlice = ({ folders, projectName }: Props): FolderTask[] => {
  const { sliceType, rowSelection } = useSlicerContext()

  //   users data
  const { data: projectUsers = [] } = useGetKanbanProjectUsersQuery(
    { projects: [projectName] },
    {
      skip: !projectName || sliceType !== 'users',
    },
  )

  const selectedUsers = projectUsers
    .filter((user) => rowSelection[user.name])
    .map((user) => user.name)

  //  build filter array
  const filters: TaskFilterValue[] = [
    {
      id: 'assignees',
      type: 'list_of_strings',
      inverted: false,
      values: selectedUsers.map((userName) => ({ id: userName })),
    },
  ]

  // filter tasks
  const filteredTasksFolders = useMemo(
    () => (sliceType === 'hierarchy' ? folders : filterTasksBySearch(folders, filters)),
    [folders, filters],
  )

  return filteredTasksFolders
}

export default useFilterBySlice
