import { useGetFolderListQuery } from '@queries/getHierarchy'
import { $Any } from '@types'
import { Filter } from '@ynput/ayon-react-components'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { mapQueryFilters } from '../mappers'
import { useGetTasksFoldersQuery } from '@queries/project/getProject'

type Params = {
  projectName: string
  folderTypes: $Any
  taskTypes: $Any
  selectedFolders: string[]
  filters: Filter[],
  sliceFilter: TaskFilterValue | null,
}

const useFetchEditorEntities = ({
  projectName,
  selectedFolders,
  filters,
  sliceFilter,
}: Params) => {

  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
  } = useGetFolderListQuery(
    { projectName: projectName || '', attrib: true },
    { skip: !projectName },
  )
  let foldersById = folders.reduce(function (map, obj) {
    //@ts-ignore
    map[obj.id] = obj
    return map
  }, {})

  // @ts-ignore
  const selectedPaths = selectedFolders.map((id) => foldersById[id].path)
  const selectedPathsPrefixed = selectedPaths.map((path: string) => '/' + path)
  const queryFilters = mapQueryFilters({ filters, sliceFilter })

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

  // const entities = useGetPaginatedFilteredEntitiesQuery({ projectName, ...queryFilters })
  // const tasks = entities.data?.tasks || {}
  const tasks = {}

  const query = mapQFtoQ(queryFilters)

  const {data: tasksFolders, isLoading: isLoadingTaskFolders }= useGetTasksFoldersQuery({ projectName, query})


  return {
    rawData: filteredFolders,
    folders: folders.reduce((acc, curr) => ({ ...acc, [curr.id as string]: curr }), {}),
    tasks,
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
          key: 'status',
          operator: 'eq',
          value: 'In progress',
        },
        {
          operator: 'or',
          conditions: [
            {
              key: 'status',
              operator: 'eq',
              value: 'In progress',
            },
            {
              key: 'status',
              operator: 'eq',
              value: 'On hold',
            },
            {
              key: 'status',
              operator: 'eq',
              value: 'Pending review',
            },
            {
              key: 'status',
              operator: 'eq',
              value: 'Not ready',
            },
            {
              key: 'status',
              operator: 'eq',
              value: 'Ready to start',
            },
          ],
        },
      ],
    },
  }
}