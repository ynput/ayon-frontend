import { useGetFolderListQuery } from '@queries/getHierarchy'
import { $Any } from '@types'
import { Filter } from '@ynput/ayon-react-components'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
// import { mapQueryFilters } from '../mappers/mappers'
// import { useGetTasksFoldersQuery } from '@queries/project/getProject'
import { useGetOverviewTasksByFoldersQuery } from '@queries/overview/getOverview'
import { FolderNodeMap, TaskNodeMap } from '../types'
import { useMemo } from 'react'

type Params = {
  projectName: string
  selectedFolders: string[]
  filters: Filter[]
  sliceFilter: TaskFilterValue | null
  expanded: Record<string, boolean>
}

const filterFoldersByPath = (folders: $Any[], selectedPaths: string[]) => {
  if (selectedPaths.length === 0) return folders

  return folders.filter((el) => {
    for (const path of selectedPaths) {
      if (el.path.startsWith(path)) {
        return true
      }
    }
    return false
  })
}

export type TasksByFolderMap = Map<string, string[]>

type UseFetchEditorEntitiesData = {
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  tasksByFolderMap: TasksByFolderMap
  isLoading: boolean
  selectedPaths: string[]
}

const useFetchEditorEntities = ({
  projectName,
  selectedFolders,
  filters,
  sliceFilter,
  expanded,
}: Params): UseFetchEditorEntitiesData => {
  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
  } = useGetFolderListQuery(
    { projectName: projectName || '', attrib: true },
    { skip: !projectName },
  )

  console.log('Folder count:', folders.length)

  // create a map of folders by id for efficient lookups
  const foldersMap: FolderNodeMap = useMemo(() => {
    const map = new Map()
    for (const folder of folders) {
      map.set(folder.id as string, folder)
    }
    return map
  }, [folders])

  const { data: expandedFoldersTasks = [] } = useGetOverviewTasksByFoldersQuery(
    {
      projectName,
      parentIds: Object.keys(expanded),
    },
    { skip: !Object.keys(expanded).length },
  )

  // tasksMaps is a map of tasks by task ID
  // tasksByFolderMap is a map of tasks by folder ID
  const { tasksMap, tasksByFolderMap } = useMemo(() => {
    const tasksMap: TaskNodeMap = new Map()
    const tasksByFolderMap: TasksByFolderMap = new Map()

    for (const task of expandedFoldersTasks) {
      const taskId = task.id as string
      const folderId = task.folderId as string

      tasksMap.set(taskId, task)

      if (tasksByFolderMap.has(folderId)) {
        tasksByFolderMap.get(folderId)!.push(taskId)
      } else {
        tasksByFolderMap.set(folderId, [taskId])
      }
    }

    return { tasksMap, tasksByFolderMap }
  }, [expandedFoldersTasks])

  const selectedPaths = useMemo(() => {
    return selectedFolders.map((id) => foldersMap.get(id)?.path!).filter(Boolean) as string[]
  }, [selectedFolders, foldersMap])

  const selectedPathsPrefixed = useMemo(() => {
    return selectedPaths.map((path: string) => '/' + path)
  }, [selectedPaths])

  // transform the filters of tasks to the query format
  // const queryFilters = mapQueryFilters({ filters, sliceFilter })

  // BROKEN (needs doing)
  // const query = !!filters.length && mapQFtoQ(queryFilters)

  // NOTE: SKIPPING AS THE QUERY IS BROKEN
  // get folders that that would be displayed for the matching task filters. (folders for the matching tasks)
  // const { data: tasksFolders, isLoading: isLoadingTaskFolders } = useGetTasksFoldersQuery(
  //   {
  //     projectName,
  //     query,
  //   },
  //   { skip: !query },
  // )

  // console.time('foldersToObject')
  // Folders map: 3 (same as foldersMap map?) 8 seconds with 10,000
  // const foldersObject = folders.reduce((acc, curr) => ({ ...acc, [curr.id as string]: curr }), {})
  // console.timeEnd('foldersToObject')

  return {
    foldersMap: foldersMap,
    tasksMap: tasksMap,
    tasksByFolderMap: tasksByFolderMap,
    isLoading: isLoading || isFetching,
    selectedPaths: selectedPathsPrefixed,
  }
}

export default useFetchEditorEntities

// BROKEN!!!
// const mapQFtoQ = (queryFilters: $Any) => {
//   return {
//     filter: {
//       operator: 'or',
//       conditions: [
//         {
//           operator: 'or',
//           conditions: [
//             { key: 'status', operator: 'eq', value: 'In progress' },
//             // { key: 'status', operator: 'eq', value: 'On hold', },
//             // { key: 'status', operator: 'eq', value: 'Pending review', },
//             // { key: 'status', operator: 'eq', value: 'Not ready', },
//             // { key: 'status', operator: 'eq', value: 'Ready to start', },
//           ],
//         },
//       ],
//     },
//   }
// }
