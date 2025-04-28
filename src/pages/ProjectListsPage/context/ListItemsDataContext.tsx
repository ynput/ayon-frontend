import { createContext, useContext, ReactNode, useMemo } from 'react'
import { EntityListItem } from '@queries/lists/getLists'
import {
  ProjectDataContextProps,
  useProjectDataContext,
} from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { Filter } from '@ynput/ayon-react-components'
import { useUsersPageConfig } from '@pages/ProjectOverviewPage/hooks/useUserPageConfig'
import useGetListItemsData from '../hooks/useGetListItemsData'
import { useListsContext } from './ListsContext'
import {
  FolderNodeMap,
  TableRow,
  TaskNodeMap,
  useGetEntityTypeData,
} from '@shared/containers/ProjectTreeTable'

export type ListItemsMap = Map<string, EntityListItem>

interface ListItemsDataContextValue {
  // Project Info
  projectInfo?: ProjectDataContextProps['projectInfo']
  projectName: string
  users: ProjectDataContextProps['users']
  // Attributes
  attribFields: ProjectDataContextProps['attribFields']

  // LIST ITEMS DATA
  listItemsData: EntityListItem[]
  listItemsTableData: TableRow[]
  listItemsMap: ListItemsMap
  fetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
  isError?: boolean
  // filters
  listItemsFilters: Filter[]
  setListItemsFilters: (filters: Filter[]) => Promise<void>
  // folders data
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
}

const ListItemsDataContext = createContext<ListItemsDataContextValue | undefined>(undefined)

interface ListItemsDataProviderProps {
  children: ReactNode
}

// fetch all items and provide methods to update the items
export const ListItemsDataProvider = ({ children }: ListItemsDataProviderProps) => {
  // Get project data from the new context
  const {
    projectName,
    projectInfo,
    attribFields,
    users,
    isInitialized,
    isLoading: isLoadingData,
    columnSorting,
    setColumnSorting,
  } = useProjectDataContext()

  const getEntityTypeData = useGetEntityTypeData({ projectInfo })

  const { rowSelection } = useListsContext()
  const selectedListsIds = Object.entries(rowSelection)
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => id)
  const selectedListId = selectedListsIds.length === 1 ? selectedListsIds[0] : undefined

  const [pageConfig, updatePageConfig, { isSuccess: columnsConfigReady }] = useUsersPageConfig({
    page: 'lists',
    projectName: projectName,
  })

  const listItemsFilters = pageConfig?.listItemsFilters || ([] as Filter[])
  const setListItemsFilters = async (filters: Filter[]) => {
    await updatePageConfig({ items: { filters } })
  }

  const {
    data: listItemsData,
    isLoading,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  } = useGetListItemsData({
    projectName,
    listId: selectedListId,
    sortBy: undefined,
    filters: listItemsFilters,
  })

  // convert to a Map for easier access
  const listItemsMap: ListItemsMap = useMemo(() => {
    return new Map(listItemsData.map((item) => [item.id, item]))
  }, [listItemsData])

  const extractPath = (item: EntityListItem, entityType: string): string => {
    switch (entityType) {
      case 'folder':
        return item.path || ''
      case 'task':
        return item.folder?.path || ''
      case 'product':
        return item.folder?.path || ''
      case 'version':
        return item.product?.folder?.path || '' + item.task?.name || ''
      default:
        return ''
    }
  }

  const extractSubType = (item: EntityListItem, entityType?: string): string | undefined => {
    switch (entityType) {
      case 'folder':
        return item.folderType
      case 'task':
        return item.taskType
      case 'product':
        return item.productType || ''
      case 'version':
        return undefined
      default:
        return undefined
    }
  }

  // convert listItemsData into tableData
  const listItemsTableData = useMemo(() => {
    const tableRows: TableRow[] = listItemsData.map((list) => ({
      id: list.id,
      name: list.name,
      label: list.name,
      entityType: list.entityType,
      attrib: list.attrib,
      ownAttrib: list.ownAttrib || Object.keys(list.attrib),
      icon: getEntityTypeData(list.entityType, extractSubType(list, list.entityType))?.icon,
      path: extractPath(list, list.entityType),
      tags: list.tags,
      status: list.status,
      subRows: [],
    }))

    return tableRows
  }, [listItemsData])

  console.log(listItemsData)
  console.log(listItemsTableData)

  const foldersMap: FolderNodeMap = new Map(
    // @ts-ignore
    listItemsData.filter((item) => item.entityType === 'folder'),
  )
  const tasksMap: TaskNodeMap = new Map()

  return (
    <ListItemsDataContext.Provider
      value={{
        projectName,
        projectInfo,
        attribFields,
        users,
        // list items
        listItemsData,
        listItemsTableData,
        listItemsMap,
        isLoadingAll: isLoading || !columnsConfigReady,
        isLoadingMore: isFetchingNextPage,
        isError,
        fetchNextPage,
        // filters
        listItemsFilters,
        setListItemsFilters,
        // folders data
        foldersMap,
        tasksMap,
      }}
    >
      {children}
    </ListItemsDataContext.Provider>
  )
}

export const useListItemsDataContext = () => {
  const context = useContext(ListItemsDataContext)
  if (context === undefined) {
    throw new Error('useListItemsDataContext must be used within a ListItemsDataProvider')
  }
  return context
}

export default ListItemsDataContext
