import { useGetFolderListQuery } from '@queries/getHierarchy'
import { $Any } from '@types'
import { Filter } from '@ynput/ayon-react-components'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { mapQueryFilters } from '../mappers/mappers'
import { useGetTasksFoldersQuery } from '@queries/project/getProject'
import { useGetFilteredEntitiesByParentQuery } from '@queries/overview/getFilteredEntities'

type Params = {
  projectName: string
  folderTypes: $Any
  taskTypes: $Any
  selectedFolders: string[]
  filters: Filter[]
  sliceFilter: TaskFilterValue | null
  expanded: Record<string, boolean>
}

const useFetchEditorEntities = ({
  projectName,
  selectedFolders,
  filters,
  sliceFilter,
  expanded,
}: Params) => {
  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
  } = useGetFolderListQuery(
    { projectName: projectName || '', attrib: true },
    { skip: !projectName },
  )

  // console.time('folderById')
  // Folders map: 1

  // 3ms with 10,000
  // let foldersById = folders.reduce(function (map, obj) {
  //   //@ts-ignore
  //   map[obj.id] = obj
  //   return map
  // }, {})

  // 1ms with 10,000
  const foldersById: Record<string, $Any> = {}
  for (const folder of folders) {
    foldersById[folder.id as string] = folder
  }
  // console.timeEnd('folderById')

  // @ts-ignore
  const { data: expandedFoldersTasks } = useGetFilteredEntitiesByParentQuery({
    projectName,
    parentIds: Object.keys(expanded),
  })

  // @ts-ignore
  const selectedPaths = selectedFolders.map((id) => foldersById[id]?.path)
  const selectedPathsPrefixed = selectedPaths.map((path: string) => '/' + path)
  const queryFilters = mapQueryFilters({ filters, sliceFilter })

  // Folders map: 2
  const filteredFolders =
    selectedPaths.length > 0
      ? folders.filter((el) => {
          for (const path of selectedPaths) {
            if (el.path.startsWith(path)) {
              return true
            }
          }
          return false
        })
      : folders

  const query = mapQFtoQ(queryFilters)

  const { data: tasksFolders, isLoading: isLoadingTaskFolders } = useGetTasksFoldersQuery({
    projectName,
    query,
  })

  console.log('Folder count:', folders.length)

  // console.time('foldersToObject')
  // Folders map: 3 (same as foldersById map?) 8 seconds with 10,000
  // const foldersObject = folders.reduce((acc, curr) => ({ ...acc, [curr.id as string]: curr }), {})
  // console.timeEnd('foldersToObject')

  return {
    rawData: filteredFolders,
    folders: foldersById,
    tasks: expandedFoldersTasks?.tasks ?? {},
    tasksFolders: tasksFolders,
    isLoading: isLoading || isFetching || isLoadingTaskFolders,
    selectedPaths: selectedPathsPrefixed,
  }
}

export default useFetchEditorEntities

const mapQFtoQ = (queryFilters: $Any) => {
  return {
    filter: {
      operator: 'or',
      conditions: [
        {
          operator: 'or',
          conditions: [
            { key: 'status', operator: 'eq', value: 'In progress' },
            // { key: 'status', operator: 'eq', value: 'On hold', },
            // { key: 'status', operator: 'eq', value: 'Pending review', },
            // { key: 'status', operator: 'eq', value: 'Not ready', },
            // { key: 'status', operator: 'eq', value: 'Ready to start', },
          ],
        },
      ],
    },
  }
}
