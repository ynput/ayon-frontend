import { createContext, useContext, ReactNode, useMemo, useCallback, useState } from 'react'
import {
  checkColumnVisibility,
  ProjectDataContextProps,
  useProjectDataContext,
} from '@shared/containers/ProjectTreeTable'
import useGetListItemsData, { EntityListItemWithLinks } from '../hooks/useGetListItemsData'
import { useListsContext } from './ListsContext'
import { FolderNodeMap, TableRow, TaskNodeMap } from '@shared/containers/ProjectTreeTable'
import useDeleteListItems, { UseDeleteListItemsReturn } from '../hooks/useDeleteListItems'
import { ContextMenuItemConstructors } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import { useEntityListsContext } from './EntityListsContext'
import useReorderListItem, { UseReorderListItemReturn } from '../hooks/useReorderListItem'
import useBuildListItemsTableData from '../hooks/useBuildListItemsTableData'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { ListsViewSettings, useListsViewSettings, useViewsContext } from '@shared/containers'
import { SortingState, VisibilityState } from '@tanstack/react-table'
import { useProjectContext, OnSyncDataCallback } from '@shared/context'
import type { FieldStats } from '@shared/api'
import { useReviewCardsSettingsContext } from './ReviewCardsSettingsContext'
import {
  DEFAULT_COLUMNS_FOLDER,
  DEFAULT_COLUMNS_PRODUCT,
  DEFAULT_COLUMNS_TASK,
  DEFAULT_COLUMNS_VERSION,
} from '@pages/ProjectsPage/constants'
import useReplaceListItem from '../hooks/useReplaceListItem'

export type ListItemsMap = Map<string, EntityListItemWithLinks>

export interface ListItemsDataContextValue {
  // Project Info
  users: ProjectDataContextProps['users']
  selectedListId?: string
  // Attributes
  attribFields: ProjectDataContextProps['attribFields']
  defaultColumnVisibility?: VisibilityState

  // LIST ITEMS DATA
  listItemsData: EntityListItemWithLinks[]
  listItemsTableData: TableRow[]
  listItemsMap: ListItemsMap
  fetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
  isError?: boolean
  error?: unknown
  isInitialized: boolean
  // filters
  listItemsFilters: QueryFilter
  setListItemsFilters: (filters: QueryFilter) => void
  // folders data
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  // columns config
  columns: ListsViewSettings['columns']
  onUpdateColumns: ListsViewSettings['onUpdateColumns']
  // context menu items
  // actions
  contextMenuItems: ContextMenuItemConstructors
  // delete (remove) from list
  deleteListItems: UseDeleteListItemsReturn['deleteListItems']
  deleteListItemAction: UseDeleteListItemsReturn['deleteListItemAction']
  // reorder list item
  reorderListItem: UseReorderListItemReturn['reorderListItem']
  // replace list items
  replaceListItemsState: readonly [null | string[], (ids: null | string[]) => void]
  // reset filters
  resetFilters: () => void
  refetch: () => void
  onSyncData: OnSyncDataCallback
  // links visibility
  setLinksVisible: (visible: boolean) => void
  // column summaries footer (powerpack)
  fieldStats: FieldStats[]
  fieldStatsLoading: boolean
  fieldStatsError: boolean
  mainCountLabels: { primary: string }
}

const ListItemsDataContext = createContext<ListItemsDataContextValue | undefined>(undefined)

interface ListItemsDataProviderProps {
  children: ReactNode
}

const reviewSortKeys = new Map([
  ['task', 'task_id'],
  ['product', 'product_id'],
  ['path', 'name'],
  ['versionAuthor', 'author'],
])

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  'link_*': false,
  tags: true,
}

export const DEFAULT_COLUMNS_BY_TYPE: Record<string, VisibilityState> = {
  folder: { ...DEFAULT_COLUMN_VISIBILITY, ...DEFAULT_COLUMNS_FOLDER },
  task: { ...DEFAULT_COLUMN_VISIBILITY, ...DEFAULT_COLUMNS_TASK },
  version: { ...DEFAULT_COLUMN_VISIBILITY, ...DEFAULT_COLUMNS_VERSION },
  product: { ...DEFAULT_COLUMN_VISIBILITY, ...DEFAULT_COLUMNS_PRODUCT },
}

// fetch all items and provide methods to update the items
export const ListItemsDataProvider = ({ children }: ListItemsDataProviderProps) => {
  // Get project data from the new context
  const { projectName } = useProjectContext()
  const { attribFields, users, isInitialized, isLoading: isLoadingData } = useProjectDataContext()
  const { displayStyle } = useReviewCardsSettingsContext()

  const { selectedList, isReview } = useListsContext()
  const selectedListId = selectedList?.id
  const listEntityType = selectedList?.entityType

  const defaultColumnVisibility = useMemo(
    () => (listEntityType ? DEFAULT_COLUMNS_BY_TYPE[listEntityType] : DEFAULT_COLUMN_VISIBILITY),
    [listEntityType],
  )

  const [linksVisible, setLinksVisible] = useState(false)

  const { isLoadingViews } = useViewsContext()
  const {
    filters: listItemsFilters,
    onUpdateFilters: setListItemsFilters,
    columns,
    onUpdateColumns,
  } = useListsViewSettings()

  const hasLinkColumn = useMemo(
    () => checkColumnVisibility(columns.columnVisibility, 'link_', defaultColumnVisibility),
    [columns, defaultColumnVisibility],
  )

  const skipLinks = displayStyle !== 'table' || !hasLinkColumn || !linksVisible

  // comments are the heaviest field to resolve, so only fetch them when the column is shown
  const showComments = useMemo(
    () => checkColumnVisibility(columns.columnVisibility, 'comments', defaultColumnVisibility),
    [columns, defaultColumnVisibility],
  )

  const updateSorting = (sorting: SortingState) => {
    onUpdateColumns(
      {
        ...columns,
        sorting,
      },
      // best-effort allColumnIds: collect from current columns states
      [
        ...(columns.columnOrder || []),
        ...Object.keys(columns.columnVisibility || {}),
        ...((columns.columnPinning?.left as string[]) || []),
        ...((columns.columnPinning?.right as string[]) || []),
      ],
    )
  }

  const resetFilters = useCallback(() => {
    setListItemsFilters({ conditions: [], operator: 'and' })
  }, [setListItemsFilters])

  // For review sessions, we use the sorting setting stored in the entity list's `data`.
  // This allows us to use the sorting in the review session itself, too.
  const reviewSorting: SortingState | null = useMemo(() => {
    if (!isReview) return null

    const sorting = selectedList?.data.sorting
    if (!sorting) return null

    return [
      {
        id: reviewSortKeys.get(sorting.property) ?? sorting.property,
        desc: sorting.order,
      },
    ]
  }, [isReview, selectedList?.data.sorting])

  const {
    data: listItemsData,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
    refetch,
    onSyncData,
    fieldStats,
    fieldStatsLoading,
    fieldStatsError,
    mainCountLabels,
  } = useGetListItemsData({
    projectName,
    entityType: selectedList?.entityType,
    listId: selectedListId,
    sorting: reviewSorting ?? columns.sorting ?? [],
    filters: listItemsFilters,
    skipLinks: skipLinks,
    showComments,
    isLoadingViews,
    defaultColumnVisibility,
  })

  // filter out attribFields by scope for the table columns
  const scopedAttribFields = useMemo(
    () =>
      attribFields.filter((field) =>
        [selectedList?.entityType].some((s: any) => field.scope?.includes(s)),
      ),
    [attribFields, selectedList?.entityType],
  )

  // convert to a Map for easier access
  const listItemsMap: ListItemsMap = useMemo(() => {
    return new Map(listItemsData.map((item) => [item.id, item]))
  }, [listItemsData])

  // convert listItemsData into tableData
  const listItemsTableData = useBuildListItemsTableData({
    listItemsData,
  })

  const foldersMap: FolderNodeMap = new Map(
    // @ts-ignore
    listItemsData.filter((item) => item.entityType === 'folder'),
  )
  const tasksMap: TaskNodeMap = new Map()

  // delete lists
  const { deleteListItems, deleteListItemMenuItem, deleteListItemAction } = useDeleteListItems({
    projectName: projectName,
    listId: selectedListId,
    listItemsMap,
    accessLevel: selectedList?.accessLevel,
  })

  const { replaceItemContextMenu, state: replaceListItemsState } = useReplaceListItem({
    entityType: listEntityType || '',
  })

  const handleReorderFinished = () => {
    // remove any sorting
    updateSorting([])
  }

  // reorder lists item
  const { reorderListItem } = useReorderListItem({
    projectName: projectName,
    listId: selectedListId,
    listItems: listItemsData,
    onReorderFinished: handleReorderFinished,
  })

  // lists data
  const { menuItems: menuItemsAddToList } = useEntityListsContext()

  // inject in custom add to list context menu items
  const contextMenuItems: ContextMenuItemConstructors = [
    'copy-paste',
    'show-details',
    'open-viewer',
    // add context menu to add to lists but filter out own list
    menuItemsAddToList((item) => item.id !== selectedListId),
    replaceItemContextMenu,
    deleteListItemMenuItem,
  ]

  return (
    <ListItemsDataContext.Provider
      value={{
        selectedListId,
        attribFields: scopedAttribFields,
        users,
        defaultColumnVisibility,
        // list items
        listItemsData,
        listItemsTableData,
        listItemsMap,
        isLoadingAll: isLoading || isLoadingData,
        isLoadingMore: isFetchingNextPage,
        isError,
        error,
        fetchNextPage,
        // filters
        listItemsFilters,
        setListItemsFilters,
        // folders data
        foldersMap,
        tasksMap,
        isInitialized,
        // columns config
        columns,
        onUpdateColumns,
        // actions
        contextMenuItems,
        // delete (remove) from list
        deleteListItems,
        deleteListItemAction,
        // reorder list item
        reorderListItem,
        // replace list items
        replaceListItemsState,
        resetFilters,
        refetch,
        onSyncData,
        setLinksVisible,
        fieldStats,
        fieldStatsLoading,
        fieldStatsError,
        mainCountLabels,
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
