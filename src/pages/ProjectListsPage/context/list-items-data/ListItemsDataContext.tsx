import { ReactNode, useMemo, useCallback, useState } from 'react'
import {
  checkColumnVisibility,
  ProjectDataContextProps,
  useProjectDataContext,
} from '@shared/containers/ProjectTreeTable'
import useGetListItemsData, { EntityListItemWithLinks } from '../../hooks/useGetListItemsData'
import { useListsContext } from '../lists/ListsContext'
import {
  FolderNodeMap,
  MatchingFolder,
  TableRow,
  TaskNodeMap,
} from '@shared/containers/ProjectTreeTable'
import useDeleteListItems, { UseDeleteListItemsReturn } from '../../hooks/useDeleteListItems'
import type {
  ContextMenuItemConstructor,
  ContextMenuItemConstructors,
} from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import { parseCellId } from '@shared/containers/ProjectTreeTable'
import { useEntityListsContext } from '../entity-lists/EntityListsContextInstance'
import useReorderListItem, { UseReorderListItemReturn } from '../../hooks/useReorderListItem'
import useBuildListItemsTableData from '../../hooks/useBuildListItemsTableData'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { ListsViewSettings, useListsViewSettings, useViewsContext } from '@shared/containers'
import { SortingState, VisibilityState } from '@tanstack/react-table'
import { useProjectContext, OnSyncDataCallback } from '@shared/context'
import type { FieldStats } from '@shared/api'
import { useReviewCardsSettingsContext } from '../review-cards-settings/ReviewCardsSettingsContextInstance'
import useReplaceListItem from '../../hooks/useReplaceListItem'
import { ListItemsDataContext } from './ListItemsDataContextInstance'
import { DEFAULT_COLUMN_VISIBILITY, DEFAULT_COLUMNS_BY_TYPE } from './ListItemsDataContextHelpers'
import { useListValuesContext } from '../list-values'
import { useListsDataContext } from '../lists-data'
import useListValueActions from '../../hooks/useListValueActions'
import { useListItemsForListValues } from '../../hooks/useListItemsForListValues'
import { getListItemValueSources, toListValuesItem } from '../../listValues/listItemValueSources'
import type { CompareSettings, CompareView, ListRef } from '../../listValues/types'
import type { ColumnMenuItemType } from '@shared/components/ColumnHeaderMenuUI'

export type ListItemsMap = Map<string, EntityListItemWithLinks>

const NO_LIST_VALUES_SETTINGS: CompareSettings = {}

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
  // the powerpack ListValues module's compare view (empty without the powerpack)
  compareView: CompareView<EntityListItemWithLinks>
  listValuesSettings: CompareSettings
  setListValuesSettings: (settings: CompareSettings) => void
  // list value actions in an attribute column's header menu
  getListValueColumnMenuItems: (attrib: string) => ColumnMenuItemType[]
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

interface ListItemsDataProviderProps {
  children: ReactNode
}

const reviewSortKeys = new Map([
  ['task', 'task_id'],
  ['product', 'product_id'],
  ['path', 'name'],
  ['versionAuthor', 'author'],
])

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
  const { module: listValues, rules: listValuesRules, readsEntityValue } = useListValuesContext()
  const { listsMap } = useListsDataContext()
  const {
    filters: listItemsFilters,
    onUpdateFilters: setListItemsFilters,
    columns,
    onUpdateColumns,
    listValues: storedListValuesSettings,
    onUpdateListValues: setListValuesSettings,
  } = useListsViewSettings()
  // stored with the view, shaped by the ListValues module
  const listValuesSettings =
    (storedListValuesSettings as CompareSettings | undefined) || NO_LIST_VALUES_SETTINGS

  const hasLinkColumn = useMemo(
    () => checkColumnVisibility(columns.columnVisibility, 'link_', defaultColumnVisibility),
    [columns, defaultColumnVisibility],
  )

  // non-review lists are always shown as a table, only review lists use the display style
  const isTableView = !isReview || displayStyle === 'table'
  const skipLinks = !isTableView || !hasLinkColumn || !linksVisible

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
    hasNextPage,
    queryFilter,
    search,
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
    readsEntityValue,
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

  // the ListValues module's compare view, see listValues/AGENTS.md
  const shownList = useMemo<ListRef | undefined>(
    () =>
      selectedList && {
        id: selectedList.id,
        label: selectedList.label,
        entityType: selectedList.entityType,
      },
    [selectedList?.id, selectedList?.label, selectedList?.entityType],
  )
  const getList = useCallback(
    (id: string) => {
      const list = listsMap.get(id)
      return list && { id: list.id, label: list.label, entityType: list.entityType }
    },
    [listsMap],
  )
  const attributeNames = useMemo(() => scopedAttribFields.map((a) => a.name), [scopedAttribFields])
  const compareQuery = useMemo(() => ({ filter: queryFilter, search }), [queryFilter, search])
  const compareView = listValues.useCompareView<EntityListItemWithLinks>({
    shownList,
    items: listItemsData,
    allItemsLoaded: !hasNextPage,
    toItem: toListValuesItem,
    attributes: attributeNames,
    query: compareQuery,
    context: listValuesRules,
    getList,
    settings: listValuesSettings,
    useListItems: useListItemsForListValues,
  })

  // what each row shows: list values or entity values, plus the compare view's marks
  const getRowValues = useCallback(
    (item: EntityListItemWithLinks) => {
      const { attrib, ownAttrib, marks } = listValues.resolveValues(
        getListItemValueSources(item),
        listValuesRules,
      )
      const attribMarks = { ...marks }
      for (const [name, mark] of Object.entries(compareView.marks.get(item.id) || {})) {
        attribMarks[name] = { ...attribMarks[name], ...mark }
      }
      return { attrib, ownAttrib, attribMarks }
    },
    [listValues, listValuesRules, compareView.marks],
  )

  // convert listItemsData into tableData
  const shownListTableData = useBuildListItemsTableData({
    listItemsData,
    getRowValues,
  })

  // items only in the compared list: read-only rows after the list's own
  const getCompareOnlyRowValues = useCallback(
    (item: EntityListItemWithLinks) => ({
      attrib: {},
      ownAttrib: [],
      attribMarks: compareView.marks.get(item.id) || {},
    }),
    [compareView.marks],
  )
  const compareOnlyTableData = useBuildListItemsTableData({
    listItemsData: compareView.compareOnlyItems,
    getRowValues: getCompareOnlyRowValues,
  })

  const listItemsTableData = useMemo(
    () =>
      compareOnlyTableData.length
        ? [
            ...shownListTableData,
            ...compareOnlyTableData.map((row) => ({ ...row, readOnly: true })),
          ]
        : shownListTableData,
    [shownListTableData, compareOnlyTableData],
  )

  const foldersMap = useMemo<FolderNodeMap>(
    () =>
      new Map(
        listItemsData
          .filter((item) => item.entityType === 'folder')
          .map(
            (item) =>
              [
                item.entityId,
                {
                  ...item,
                  id: item.entityId,
                  entityId: item.entityId,
                  entityType: 'folder',
                  path: item.parents?.join('/') || '',
                  parents: item.parents || [],
                  folderType: item.folderType || '',
                } as MatchingFolder,
              ] as const,
          ),
      ),
    [listItemsData],
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
  const { menuItems: menuItemsAddToList, addToList } = useEntityListsContext()

  const { listValueMenuItem, getColumnMenuItems: getListValueColumnMenuItems } =
    useListValueActions({
      projectName,
      listId: selectedListId,
      entityType: listEntityType,
      listItemsMap,
      canEditList: (selectedList?.accessLevel || 0) >= 20,
    })

  // menu items that act on list items skip the rows only in the compared list
  const forListItems =
    (build: ContextMenuItemConstructor): ContextMenuItemConstructor =>
    (e, cell, selectedCells, ...rest) => {
      const cells = selectedCells.filter((c) =>
        listItemsMap.has(parseCellId(c.cellId)?.rowId || ''),
      )
      return cells.length ? build(e, cell, cells, ...rest) : undefined
    }

  // rows only in the compared list can be added to the shown one
  const addToShownListMenuItem: ContextMenuItemConstructor = (_e, _cell, selectedCells) => {
    if (!selectedListId || !selectedList || (selectedList.accessLevel || 0) < 20) return undefined
    const compareOnlyIds = new Set(compareView.compareOnlyItems.map((item) => item.id))
    const entities = [
      ...new Map(
        selectedCells
          .filter((c) => compareOnlyIds.has(parseCellId(c.cellId)?.rowId || ''))
          .map((c) => [c.entityId, { entityId: c.entityId, entityType: c.entityType }]),
      ).values(),
    ]
    if (!entities.length) return undefined
    return {
      label: 'Add to this list',
      icon: 'playlist_add',
      command: async () => {
        await addToList(selectedListId, selectedList.entityType, entities)
        compareView.refetchCompareOnly()
      },
    }
  }

  // inject in custom add to list context menu items
  const contextMenuItems: ContextMenuItemConstructors = [
    'copy-paste',
    'show-details',
    'open-viewer',
    // add context menu to add to lists but filter out own list
    menuItemsAddToList((item) => item.id !== selectedListId),
    addToShownListMenuItem,
    forListItems(replaceItemContextMenu),
    forListItems(listValueMenuItem),
    forListItems(deleteListItemMenuItem),
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
        compareView,
        listValuesSettings,
        setListValuesSettings,
        getListValueColumnMenuItems,
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
