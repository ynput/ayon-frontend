import { ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { getMixedCounts } from '@ynput/ayon-react-components'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import overviewApi, {
  useGetOverviewTasksByFoldersQuery,
} from '@shared/api/queries/overview/getOverview'
import {
  getCacheKey,
  getQueriedFolders,
  hasUnqueriedFolders,
} from '@shared/api/queries/overview/queriedFolders'
import { useProjectContext } from '@shared/context'
import { useOptionalCellEditing } from '../context/cell-editing'
import { useColumnSettingsContext } from '../context/column-settings'
import { DetailsPanelEntityContext } from '../context/details-panel-entity/DetailsPanelEntityContextInstance'
import { useProjectTableContext } from '../context/project-table'
import { useOptionalSelectedRowsContext } from '../context/selected-rows/SelectedRowsContext'
import { useOptionalSelectionCellsContext } from '../context/selection-cells'
import type { EntityUpdate } from '../hooks/useUpdateTableData'
import type { EntityData } from '../types/table'
import { getCellId, parseCellId } from '../utils/cellUtils'
import {
  NO_TASK_COLUMNS_SELECTION,
  TaskColumnsContext,
  TaskColumnsContextValue,
  TaskColumnsSelection,
  TaskColumnsSelectionContext,
} from './TaskColumnsContextInstance'
import {
  getTaskColumnDefaultWidths,
  getTaskColumnId,
  groupTasksByFolder,
  TASK_COLUMNS_CACHE_SCOPE,
  TASK_COLUMNS_MATCH_CACHE_SCOPE,
} from './taskColumnsHelpers'

// rows that only fly past while scrolling aren't asked for
const VISIBLE_ROWS_DEBOUNCE = 150
// from a task changing in the cache (optimistically, before it is saved) to asking the filter again
const MATCH_REFRESH_DELAY = 1000
// the endpoint refuses more folders than this in one request
const MAX_REFRESH_FOLDERS = 1000
const NO_IDS: string[] = []
const NO_PICKS: Record<string, string[]> = {}
const NO_TASKS: never[] = []

interface TaskColumnsProviderProps {
  /** entity ids of the rows on screen (the table's onVisibleRowsChange) */
  visibleEntityIds: string[]
  /** false where the rows are tasks (flat task list, group-by): nothing to attach a task to */
  enabled: boolean
  /** the page's task filter (a query filter as JSON) and search: cards they don't match are greyed out */
  taskFilter?: string
  taskSearch?: string
  isAllExpanded: boolean
  onAllExpandedChange: (expanded: boolean) => void
  children: ReactNode
}

type FolderTasksArgs = Parameters<typeof useGetOverviewTasksByFoldersQuery>[0] & object

// The tasks of the folders on screen in one of the provider's caches. All folders share one cache
// entry, and RTK Query ignores new args for an entry while it is fetching. Rows scrolled in during
// a request would never load, so they are asked for after it.
const useFolderTasks = (args: FolderTasksArgs, skip: boolean) => {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>()
  const query = useGetOverviewTasksByFoldersQuery(args, { skip })
  const { isFetching, error } = query

  useEffect(() => {
    if (skip || isFetching || error || !hasUnqueriedFolders(args)) return
    dispatch(overviewApi.endpoints.getOverviewTasksByFolders.initiate(args, { subscribe: false }))
  }, [skip, isFetching, error, args, dispatch])

  return query
}

/**
 * Loads the tasks behind the shown task columns for the folder rows on screen, and holds which
 * rows are tall. Tasks come from getOverviewTasksByFolders in a cache of its own: it must not
 * carry the page's task filter (a filtered-out task would blank its cell), and it gets that
 * endpoint's realtime updates and optimistic patches. A second cache asks for the same tasks
 * with the page's task filter, to grey out the cards it does not match.
 */
export const TaskColumnsProvider = ({
  visibleEntityIds,
  enabled,
  taskFilter,
  taskSearch,
  isAllExpanded,
  onAllExpandedChange,
  children,
}: TaskColumnsProviderProps) => {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>()
  const { projectName, taskTypes = [], statuses: projectStatuses = [] } = useProjectContext()
  const { columnVisibility } = useColumnSettingsContext()
  const { getEntityById, isRowReadOnly, users, attribFields } = useProjectTableContext()
  const selectedCells = useOptionalSelectionCellsContext()?.selectedCells
  const updateEntities = useOptionalCellEditing()?.updateEntities

  const statuses = useMemo(
    () => projectStatuses.filter((status) => !status.scope || status.scope.includes('task')),
    [projectStatuses],
  )
  const priorityAttrib = attribFields.find((attrib) => attrib.name === 'priority')
  const priorities = useMemo(
    () => (priorityAttrib?.scope?.includes('task') && priorityAttrib.data.enum) || NO_TASKS,
    [priorityAttrib],
  )

  // the task types that have a shown column
  const shownTypesKey = taskTypes
    .map((taskType) => taskType.name)
    .filter((name) => columnVisibility[getTaskColumnId(name)])
    .sort()
    .join('\n')
  const isActive = enabled && !!shownTypesKey

  const folderIdsKey = isActive
    ? visibleEntityIds
        .filter((id) => {
          const entity = getEntityById(id)
          return entity?.entityType === 'folder' && entity.hasTasks !== false
        })
        .join(',')
    : ''
  const [folderIds, setFolderIds] = useState<string[]>(NO_IDS)
  useEffect(() => {
    const timer = setTimeout(
      () => setFolderIds(folderIdsKey ? folderIdsKey.split(',') : NO_IDS),
      VISIBLE_ROWS_DEBOUNCE,
    )
    return () => clearTimeout(timer)
  }, [folderIdsKey])

  const args = useMemo(
    () => ({
      projectName,
      parentIds: folderIds,
      filter: JSON.stringify({
        conditions: [{ key: 'taskType', operator: 'in', value: shownTypesKey.split('\n') }],
        operator: 'and',
      }),
      scope: TASK_COLUMNS_CACHE_SCOPE,
    }),
    [projectName, folderIds, shownTypesKey],
  )
  const skip = !isActive || !folderIds.length
  const { data: tasks, fulfilledTimeStamp } = useFolderTasks(args, skip)

  const tasksByFolder = useMemo(() => groupTasksByFolder(skip ? [] : tasks || []), [tasks, skip])

  // the page's task filter, narrowed to the shown types like the cache above
  const matchArgs = useMemo(() => {
    let pageFilter: unknown
    try {
      pageFilter = taskFilter ? JSON.parse(taskFilter) : undefined
    } catch {
      pageFilter = undefined
    }
    const typesFilter = JSON.parse(args.filter)
    return {
      ...args,
      filter: JSON.stringify(
        pageFilter ? { conditions: [typesFilter, pageFilter], operator: 'and' } : typesFilter,
      ),
      search: taskSearch || undefined,
      scope: TASK_COLUMNS_MATCH_CACHE_SCOPE,
    }
  }, [args, taskFilter, taskSearch])
  const hasTaskFilter = !skip && (!!taskFilter || !!taskSearch)
  const {
    currentData: matchedTasks,
    isFetching: isFetchingMatch,
    fulfilledTimeStamp: matchTimeStamp,
  } = useFolderTasks(matchArgs, !hasTaskFilter)

  // What the filter matched as of the last finished request. One in flight (more rows, a new
  // filter, a refresh) would light every card up until it is back.
  const matchRef = useRef<{ taskIds: Set<string>; folderIds: Set<string> }>()
  const match = useMemo(() => {
    if (!hasTaskFilter) return (matchRef.current = undefined)
    if (isFetchingMatch || !matchedTasks) return matchRef.current
    const { projectName, filter, search, scope } = matchArgs
    return (matchRef.current = {
      taskIds: new Set(matchedTasks.map((task) => task.id)),
      // a copy: the registry's set is filled and dropped by the requests
      folderIds: new Set(
        getQueriedFolders(getCacheKey(projectName, filter, undefined, search, undefined, scope)),
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTaskFilter, isFetchingMatch, matchedTasks, matchArgs, matchTimeStamp])

  // The filter is the server's to evaluate, and a cache only learns of a task's new values, not
  // whether it still matches. So when a shown task changes (an edit here or in its own row, an
  // undo, another user) the match is asked for again, once the change had time to be saved.
  const refreshRef = useRef({ hasTaskFilter, matchArgs, match })
  refreshRef.current = { hasTaskFilter, matchArgs, match }
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>()
  const refreshMatch = useCallback(
    (delay: number) => {
      clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => {
        const { hasTaskFilter, matchArgs, match } = refreshRef.current
        if (!hasTaskFilter) return
        // A refresh starts the cache over with the folders it is given. Every folder asked about
        // so far is asked again, not only those on screen: a selection can reach past them, and
        // an edit must keep knowing which of its cards the filter leaves out.
        const parentIds = [...new Set([...matchArgs.parentIds, ...(match?.folderIds || [])])]
        dispatch(
          overviewApi.endpoints.getOverviewTasksByFolders.initiate(
            { ...matchArgs, parentIds: parentIds.slice(0, MAX_REFRESH_FOLDERS) },
            { subscribe: false, forceRefetch: true },
          ),
        )
      }, delay)
    },
    [dispatch],
  )
  useEffect(() => () => clearTimeout(refreshTimer.current), [])

  const knownTasks = useRef<Map<string, unknown>>()
  useEffect(() => {
    const known = knownTasks.current
    const current = new Map((tasks || []).map((task) => [task.id, task]))
    knownTasks.current = current
    if (!hasTaskFilter || !known) return
    // more rows loading keeps the tasks it had as they are; a task that left has no card
    for (const [id, task] of known) {
      const now = current.get(id)
      if (now && now !== task) return refreshMatch(MATCH_REFRESH_DELAY)
    }
  }, [tasks, hasTaskFilter, refreshMatch])

  const isTaskDimmed = useCallback<TaskColumnsContextValue['isTaskDimmed']>(
    // a folder the filter was not asked about yet keeps its cards as they are
    (task) => !!match && match.folderIds.has(task.folderId) && !match.taskIds.has(task.id),
    [match],
  )

  // A column's default width is worked out once, from the first folders loaded with tasks of its
  // type, and then left: it would otherwise change under the user while scrolling.
  const firstWidths = useRef<{ projectName: string; widths: Record<string, number> }>()
  const widthsKey = useMemo(() => {
    if (firstWidths.current?.projectName !== projectName) {
      firstWidths.current = { projectName, widths: {} }
    }
    const { widths } = firstWidths.current
    Object.entries(getTaskColumnDefaultWidths(tasksByFolder)).forEach(([columnId, width]) => {
      widths[columnId] ??= width
    })
    return JSON.stringify(widths)
  }, [tasksByFolder, projectName])
  // the same object until a width is added: a new one rebuilds the table's columns
  const defaultWidths = useMemo<Record<string, number>>(() => JSON.parse(widthsKey), [widthsKey])

  const getTasks = useCallback<TaskColumnsContextValue['getTasks']>(
    (folderId, taskType) => {
      const folderTasks = tasksByFolder.get(folderId)?.get(taskType)
      if (folderTasks) return folderTasks
      // a folder that was asked for and has no task of the type is empty, not loading
      const loaded = getQueriedFolders(
        getCacheKey(args.projectName, args.filter, undefined, undefined, undefined, args.scope),
      )
      return loaded.has(folderId) ? NO_TASKS : undefined
    },
    // a fetch that brings no task keeps the same data, yet its folders are now loaded (empty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasksByFolder, args, fulfilledTimeStamp],
  )

  // per-row toggles are for this visit only; "expand all" is the view's
  const [toggledRows, setToggledRows] = useState<Record<string, boolean>>({})
  const isRowExpanded = useCallback(
    (rowId: string) => isActive && (toggledRows[rowId] ?? isAllExpanded),
    [isActive, toggledRows, isAllExpanded],
  )
  const toggleRowExpanded = useCallback(
    (rowId: string) =>
      setToggledRows((rows) => ({ ...rows, [rowId]: !(rows[rowId] ?? isAllExpanded) })),
    [isAllExpanded],
  )
  const toggleAllExpanded = useCallback(() => {
    setToggledRows({})
    onAllExpandedChange(!isAllExpanded)
  }, [isAllExpanded, onAllExpandedChange])

  // column ids are written one way: the shown types by their column
  const typeByColumn = useMemo(
    () => new Map(shownTypesKey.split('\n').map((name) => [getTaskColumnId(name), name])),
    [shownTypesKey],
  )

  const pressedTask = useRef<{ cellId: string; taskId: string }>()
  const notePressedTask = useCallback<TaskColumnsContextValue['notePressedTask']>(
    (cellId, taskId) => (pressedTask.current = { cellId, taskId }),
    [],
  )
  const getCellTask = useCallback<TaskColumnsContextValue['getCellTask']>(
    (rowId, columnId) => {
      const taskType = isActive ? typeByColumn.get(columnId) : undefined
      const folder = taskType ? getEntityById(rowId) : undefined
      if (!taskType || folder?.entityType !== 'folder') return undefined
      const cellTasks = tasksByFolder.get(folder.id)?.get(taskType) || NO_TASKS
      const pressed = pressedTask.current
      return (
        (pressed?.cellId === getCellId(rowId, columnId) &&
          cellTasks.find((task) => task.id === pressed.taskId)) ||
        cellTasks[0]
      )
    },
    [isActive, typeByColumn, getEntityById, tasksByFolder],
  )

  // The cards picked inside selected cells. The table knows cells only, so this sits next to its
  // selection and is dropped for a cell as soon as it is not selected.
  const [picks, setPicks] = useState(NO_PICKS)
  const picksRef = useRef(picks)
  picksRef.current = picks
  useEffect(() => {
    setPicks((picks) => {
      const kept = Object.entries(picks).filter(([cellId]) => selectedCells?.has(cellId))
      return kept.length === Object.keys(picks).length ? picks : Object.fromEntries(kept)
    })
  }, [selectedCells])

  const pressCard = useCallback<TaskColumnsContextValue['pressCard']>(
    (cellId, taskId, cellTaskIds, { isCellSelected, additive, range }) => {
      const without = (picks: Record<string, string[]>) =>
        cellId in picks
          ? Object.fromEntries(Object.entries(picks).filter(([id]) => id !== cellId))
          : picks
      // only a cell with several cards can have some of them picked
      const canPick = !!taskId && cellTaskIds.length > 1
      if (range) {
        setPicks(without)
      } else if (!additive) {
        setPicks((picks) =>
          canPick ? { [cellId]: [taskId] } : Object.keys(picks).length ? NO_PICKS : picks,
        )
      } else if (canPick && !isCellSelected) {
        setPicks((picks) => ({ ...picks, [cellId]: [taskId] }))
      } else if (canPick) {
        const current = picksRef.current[cellId] || cellTaskIds
        const next = current.includes(taskId)
          ? current.filter((id) => id !== taskId)
          : [...current, taskId]
        // its last card: the table deselects the cell
        if (!next.length) return false
        setPicks((picks) =>
          next.length === cellTaskIds.length ? without(picks) : { ...picks, [cellId]: next },
        )
        return true
      }
      return false
    },
    [],
  )

  // the details panel on the selected cards, opened by a double click on one
  const detailsPanelEntity = useContext(DetailsPanelEntityContext)
  const selectedRows = useOptionalSelectedRowsContext()
  const [isDetailsOpen, setDetailsOpen] = useState(false)
  const detailsRef = useRef({ detailsPanelEntity, selectedRows })
  detailsRef.current = { detailsPanelEntity, selectedRows }
  const openDetails = useCallback(() => {
    // selected rows and an entity opened from a cell are what the panel shows first
    const { detailsPanelEntity, selectedRows } = detailsRef.current
    if (selectedRows?.selectedRows.length) selectedRows.clearRowsSelection()
    if (detailsPanelEntity?.selectedEntity) detailsPanelEntity.clearSelectedEntity()
    setDetailsOpen(true)
  }, [])
  const closeDetails = useCallback(() => setDetailsOpen(false), [])
  // an entity opened elsewhere takes the panel over
  const hasSelectedEntity = !!detailsPanelEntity?.selectedEntity
  useEffect(() => {
    if (hasSelectedEntity) setDetailsOpen(false)
  }, [hasSelectedEntity])

  // the selected cards, with the tasks an edit goes to
  const selection = useMemo<TaskColumnsSelection>(() => {
    if (!isActive || !selectedCells?.size) return NO_TASK_COLUMNS_SELECTION
    const loadedFolders = getQueriedFolders(
      getCacheKey(args.projectName, args.filter, undefined, undefined, undefined, args.scope),
    )
    const selected: TaskColumnsSelection = {
      ...NO_TASK_COLUMNS_SELECTION,
      picks,
      cardIds: [],
      tasks: [],
      taskIds: new Set(),
    }
    for (const cellId of selectedCells) {
      const { rowId, colId } = parseCellId(cellId) || {}
      const taskType = colId && typeByColumn.get(colId)
      const folder = rowId && taskType ? getEntityById(rowId) : undefined
      if (!rowId || !taskType || folder?.entityType !== 'folder') continue
      const folderTasks = tasksByFolder.get(folder.id)?.get(taskType)
      const picked = picks[cellId]
      const cards = (folderTasks || []).filter((task) => !picked || picked.includes(task.id))
      cards.forEach((task) => selected.cardIds.push(task.id))
      if (isRowReadOnly(rowId) || folder.hasTasks === false) continue
      // Not loaded, or the filter was not asked about the folder yet (its cards show as they
      // are meanwhile): which of its tasks an edit may reach is not known
      const isKnown =
        (!!folderTasks || loadedFolders.has(folder.id)) &&
        (!hasTaskFilter || !!match?.folderIds.has(folder.id))
      if (!isKnown) {
        selected.notLoaded++
        continue
      }
      for (const task of cards) {
        // a card the filter greyed out is left alone by an edit of several
        if (isTaskDimmed(task)) continue
        selected.tasks.push({ task, rowId })
        selected.taskIds.add(task.id)
      }
    }
    if (isDetailsOpen) selected.detailsTaskIds = selected.cardIds
    selected.assigneeCounts = getMixedCounts(selected.tasks.map(({ task }) => task.assignees))
    selected.assignees = Object.keys(selected.assigneeCounts)
    return selected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isActive,
    selectedCells,
    picks,
    isDetailsOpen,
    typeByColumn,
    tasksByFolder,
    isTaskDimmed,
    hasTaskFilter,
    match,
    getEntityById,
    isRowReadOnly,
    args,
    fulfilledTimeStamp,
  ])

  // the selection left the cards: the panel does not come back with the next card selected
  const hasSelectedCards = !!selection.cardIds.length
  useEffect(() => {
    if (!hasSelectedCards) setDetailsOpen(false)
  }, [hasSelectedCards])

  const editRef = useRef({ selection, updateEntities })
  editRef.current = { selection, updateEntities }
  const editTasks = useCallback<TaskColumnsContextValue['editTasks']>(
    async (task, rowId, change) => {
      const { selection, updateEntities } = editRef.current
      if (!updateEntities) return
      // every selected card's task; a card the edit of several leaves out (greyed out by the
      // filter) is edited by itself
      const isOfSeveral = selection.tasks.length > 1 && selection.taskIds.has(task.id)
      const targets = isOfSeveral ? selection.tasks : [{ task, rowId }]

      const updates = targets.flatMap(({ task, rowId }): EntityUpdate[] => {
        // the task is the target, whatever the row: without it the edit would go to the folder.
        // Its data is what undo and error messages use while the folder is collapsed.
        const target = { id: task.id, rowId, type: 'task', entityData: task as unknown as EntityData }
        if (change.field !== 'assignees') {
          return [{ ...target, ...change, isAttrib: change.field === 'priority' }]
        }
        const assignees =
          'value' in change
            ? change.value
            : task.assignees.filter((name) => !change.removed.includes(name)).concat(change.added)
        const value = [...new Set(assignees)]
        const isSame =
          value.length === task.assignees.length &&
          value.every((name) => task.assignees.includes(name))
        return isSame ? [] : [{ ...target, field: 'assignees', value }]
      })
      if (!updates.length) return

      if (isOfSeveral && selection.notLoaded) {
        toast.warn(
          `${selection.notLoaded} selected folder${
            selection.notLoaded > 1 ? 's have' : ' has'
          } not loaded yet and ${selection.notLoaded > 1 ? 'were' : 'was'} left out.`,
        )
      }

      // one call: one step to undo
      await updateEntities(updates, true)

      // saved: what the filter matches can be asked for now
      refreshMatch(0)
    },
    [refreshMatch],
  )

  const value = useMemo<TaskColumnsContextValue>(
    () => ({
      isActive,
      getTasks,
      isRowExpanded,
      toggleRowExpanded,
      isAllExpanded,
      toggleAllExpanded,
      defaultWidths,
      statuses,
      priorities,
      users,
      getCellTask,
      notePressedTask,
      pressCard,
      openDetails,
      closeDetails,
      isTaskDimmed,
      editTasks,
    }),
    [
      isActive,
      getTasks,
      isRowExpanded,
      toggleRowExpanded,
      isAllExpanded,
      toggleAllExpanded,
      defaultWidths,
      statuses,
      priorities,
      users,
      getCellTask,
      notePressedTask,
      pressCard,
      openDetails,
      closeDetails,
      isTaskDimmed,
      editTasks,
    ],
  )

  return (
    <TaskColumnsContext.Provider value={value}>
      <TaskColumnsSelectionContext.Provider value={selection}>
        {children}
      </TaskColumnsSelectionContext.Provider>
    </TaskColumnsContext.Provider>
  )
}
