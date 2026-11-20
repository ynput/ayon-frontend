import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
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
import { useColumnSettingsContext } from '../context/column-settings'
import { useProjectTableContext } from '../context/project-table'
import { TaskColumnsContext, TaskColumnsContextValue } from './TaskColumnsContextInstance'
import {
  getTaskColumnDefaultWidths,
  getTaskColumnId,
  groupTasksByFolder,
  TASK_COLUMNS_CACHE_SCOPE,
} from './taskColumnsHelpers'

// rows that only fly past while scrolling aren't asked for
const VISIBLE_ROWS_DEBOUNCE = 150
const NO_IDS: string[] = []
const NO_TASKS: never[] = []

interface TaskColumnsProviderProps {
  /** entity ids of the rows on screen (the table's onVisibleRowsChange) */
  visibleEntityIds: string[]
  /** false where the rows are tasks (flat task list, group-by): nothing to attach a task to */
  enabled: boolean
  isAllExpanded: boolean
  onAllExpandedChange: (expanded: boolean) => void
  children: ReactNode
}

/**
 * Loads the tasks behind the shown task columns for the folder rows on screen, and holds which
 * rows are tall. Tasks come from getOverviewTasksByFolders in a cache of its own: it must not
 * carry the page's task filter (a filtered-out task would blank its cell), and it gets that
 * endpoint's realtime updates and optimistic patches.
 */
export const TaskColumnsProvider = ({
  visibleEntityIds,
  enabled,
  isAllExpanded,
  onAllExpandedChange,
  children,
}: TaskColumnsProviderProps) => {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>()
  const { projectName, taskTypes = [], statuses: projectStatuses = [] } = useProjectContext()
  const { columnVisibility } = useColumnSettingsContext()
  const { getEntityById, users, attribFields } = useProjectTableContext()

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
  const { data: tasks, isFetching, error } = useGetOverviewTasksByFoldersQuery(args, { skip })

  // All folders share one cache entry, and RTK Query ignores new args for an entry while it is
  // fetching. Rows scrolled in during a request would never load, so they are asked for after it.
  useEffect(() => {
    if (skip || isFetching || error || !hasUnqueriedFolders(args)) return
    dispatch(overviewApi.endpoints.getOverviewTasksByFolders.initiate(args, { subscribe: false }))
  }, [skip, isFetching, error, args, dispatch])

  const tasksByFolder = useMemo(() => groupTasksByFolder(skip ? [] : tasks || []), [tasks, skip])

  // the same object until a width changes: a new one rebuilds the table's columns
  const widthsKey = JSON.stringify(getTaskColumnDefaultWidths(tasksByFolder))
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
    [tasksByFolder, args],
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
    ],
  )

  return <TaskColumnsContext.Provider value={value}>{children}</TaskColumnsContext.Provider>
}
