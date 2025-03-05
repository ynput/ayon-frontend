import { useGetFilteredEntitiesByParentQuery } from '@queries/overview/getOverview'

type Params = {
  projectName: string
  expandedFolderIds: string[]
}

const useFetchExpandedFoldersData = ({ projectName, expandedFolderIds = [] }: Params) => {
  const { data: tasks, isLoading } = useGetFilteredEntitiesByParentQuery({
    projectName,
    parentIds: expandedFolderIds,
  })

  return { tasks: tasks }
}

export default useFetchExpandedFoldersData

/*
const injectTasks = (tableData: $Any, rawData: $Any, taskTypes: $Any, tasks: {[key: string]: TaskNode}) => {
  for (const taskId in tasks) {
    let folderTrail = []
    let nextId = tasks[taskId].folderId
    while (rawData.folders[nextId] !== undefined) {
      folderTrail.unshift(rawData.folders[nextId])
      nextId = rawData.folders[nextId].parentId
    }

    let rows = tableData
    for (const folder of folderTrail) {
      rows = rows.find((el) => el.id === folder.id).subRows
    }

    const task = tasks[taskId]
    rows = rows.filter((el) => el.name !== task.name)
    rows.push(taskToTableRow(taskTypes, task, task.parentId))
  }

  return tableData
}
*/
