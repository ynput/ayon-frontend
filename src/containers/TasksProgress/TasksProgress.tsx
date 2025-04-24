import { FC, useMemo, useState, useRef } from 'react'
import { ProgressTask, useGetTasksProgressQuery } from '@queries/tasksProgress/getTasksProgress'
import { $Any } from '@types'
import { useSelector } from 'react-redux'
import {
  formatTaskProgressForTable,
  getStatusChangeOperations,
  getAssigneesChangeOperations,
  resolveShiftSelect,
  getPriorityChangeOperations,
  getPlaceholderMessage,
} from './helpers'
import { useRootFolders } from './hooks'
import { useGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'
import { FolderType, Status, TaskType } from '@api/rest/project'
import { TaskFieldChange, TasksProgressTable } from './components'
// state
import { setFocusedTasks } from '@state/context'
import { useAppDispatch } from '@state/store'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import { toast } from 'react-toastify'
import { Button, Filter, Section, ShortcutTag, Spacer, Toolbar } from '@ynput/ayon-react-components'
import Shortcuts from '@containers/Shortcuts'
import { openViewer } from '@state/viewer'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import './styles.scss'
import { AttributeEnumItem } from '@api/rest/attributes'
import SearchFilterWrapper from '@components/SearchFilter/SearchFilterWrapper'
import formatFilterAttributesData from './helpers/formatFilterAttributesData'
import formatFilterTagsData from './helpers/formatFilterTagsData'
import { FilterFieldType } from '@hooks/useBuildFilterOptions'
import formatFilterAssigneesData from './helpers/formatFilterAssigneesData'
import { selectProgress } from '@state/progress'
import { useSlicerContext } from '@context/slicerContext'
import useFilterBySlice from './hooks/useFilterBySlice'
import formatSearchQueryFilters from './helpers/formatSearchQueryFilters'
import { isEmpty } from 'lodash'
import { RowSelectionState } from '@tanstack/react-table'
import { useFiltersWithHierarchy } from '@components/SearchFilter/hooks'
import useUserFilters from '@hooks/useUserFilters'
import { SelectionData, SliceType } from '@shared/containers/Slicer'

// what to search by
const searchFilterTypes: FilterFieldType[] = [
  'attributes',
  'taskType',
  'status',
  'assignees',
  'tags',
]

export type Operation = {
  id: string
  projectName: string
  data: { [key: string]: any }
  meta: { folderId: string }
}

interface TasksProgressProps {
  statuses?: Status[]
  taskTypes?: TaskType[]
  folderTypes?: FolderType[]
  priorities?: AttributeEnumItem[]
  projectName: string
}

const TasksProgress: FC<TasksProgressProps> = ({
  statuses = [],
  taskTypes = [],
  folderTypes = [],
  priorities = [],
  projectName,
}) => {
  const dispatch = useAppDispatch()
  const tableRef = useRef<any>(null)

  // FILTERS
  //
  //
  const { filters, setFilters } = useUserFilters({ page: 'progress', projectName })

  // filter out by slice
  const { rowSelection, sliceType, setPersistentRowSelectionData, persistentRowSelectionData } =
    useSlicerContext()
  const persistedHierarchySelection = isEmpty(persistentRowSelectionData)
    ? null
    : persistentRowSelectionData
  const { filter: sliceFilter } = useFilterBySlice()

  const handleFiltersChange = (value: Filter[]) => {
    setFilters(value)

    // check if we need to remove the hierarchy filter and clear hierarchy selection
    if (!value.some((filter) => filter.id === 'hierarchy')) {
      setPersistentRowSelectionData({})
    }
  }

  // if the sliceFilter is not hierarchy and hierarchy is not empty
  // add the hierarchy to the filters as disabled
  const filtersWithHierarchy = useFiltersWithHierarchy({
    sliceFilter,
    persistedHierarchySelection,
    filters,
  })

  // build the graphql query filters based on the search filters and slice selection
  const queryFilters = useMemo(
    () => formatSearchQueryFilters(filters, sliceFilter),
    [filters, sliceFilter],
  )

  //
  //
  // FILTERS

  // should rows be expanded (unless in collapsedRows)
  const [expandAll, setExpandAll] = useState(false)
  // explicitly expanded rows even when allExpanded is false
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  // explicitly collapsed rows even when allExpanded is true
  const [collapsedRows, setCollapsedRows] = useState<string[]>([])

  // hide parent folder child rows
  const [collapsedParents, setCollapsedParents] = useState<string[]>([])

  const selectedTasks = useSelector((state: $Any) => state.context.focused.tasks) as string[]
  const [activeTask, setActiveTask] = useState<string | null>(null)
  //   GET PROJECT ASSIGNEES
  const { data: users = [] } = useGetAllProjectUsersAsAssigneeQuery(
    { projectName },
    { skip: !projectName },
  )

  // when the slice type is not hierarchy we need to get the root folders
  const rootFolderIds = useRootFolders({ sliceType, projectName })

  const resolveSelectedFolders = (
    rowSelection: RowSelectionState,
    persistedHierarchySelection: SelectionData | null,
    rootFolderIds: string[],
    sliceType: SliceType,
  ): string[] => {
    if (sliceType === 'hierarchy') {
      return Object.keys(rowSelection)
    } else if (persistedHierarchySelection) {
      return Object.keys(persistedHierarchySelection)
    } else {
      return rootFolderIds
    }
  }

  const folderIdsToFetch = resolveSelectedFolders(
    rowSelection,
    persistedHierarchySelection,
    rootFolderIds,
    sliceType,
  )

  // VVV MAIN QUERY VVV
  //
  //
  // GET TASKS PROGRESS FOR FOLDERS
  const {
    data: foldersTasksData = [],
    isFetching: isFetchingTasks,
    error,
  } = useGetTasksProgressQuery(
    {
      projectName,
      folderIds: folderIdsToFetch,
      assignees: queryFilters.assignees,
      assigneesAny: queryFilters.assigneesAny,
      tags: queryFilters.tags,
      tagsAny: queryFilters.tagsAny,
      taskTypes: queryFilters.taskTypes,
      statuses: queryFilters.statuses,
      attributes: queryFilters.attributes,
    },
    { skip: !folderIdsToFetch.length || !projectName },
  )
  console.log({ foldersTasksData, isFetchingTasks, error })
  //
  //
  // ^^^ MAIN QUERY ^^^

  // create a map of all tasks
  const allTasksMap = useMemo(() => {
    const map = new Map<string, ProgressTask>()
    foldersTasksData.forEach((folder) => {
      folder.tasks.forEach((task) => {
        map.set(task.id, task)
      })
    })
    return map
  }, [foldersTasksData])

  // array of all selected tasks
  const selectedTasksData = useMemo(
    () => selectedTasks.flatMap((taskId) => allTasksMap.get(taskId) || []),
    [selectedTasks, allTasksMap],
  )

  // unique array of all assignees of selected tasks
  const selectedAssignees = useMemo(() => {
    const assignees = new Set<string>()
    selectedTasksData.forEach((task) => {
      task.assignees.forEach((assignee) => assignees.add(assignee))
    })
    return Array.from(assignees)
  }, [selectedTasksData])

  // FILTERS DATA vvv
  //
  //
  // format attributes data for the search filter (show value suggestions)
  const filterAttributesData = useMemo(
    () => formatFilterAttributesData(foldersTasksData),
    [foldersTasksData],
  )

  // format tags data for the search filter
  const filterTagsData = useMemo(() => formatFilterTagsData(foldersTasksData), [foldersTasksData])

  // format tags data for the search filter
  const filterAssigneesData = useMemo(
    () => formatFilterAssigneesData(foldersTasksData),
    [foldersTasksData],
  )

  //
  //
  // FILTERS DATA ^^^

  const tableData = useMemo(
    () =>
      formatTaskProgressForTable(foldersTasksData, collapsedParents, {
        folderTypes,
        statuses,
      }),
    [foldersTasksData, collapsedParents],
  )

  const [updateEntities] = useUpdateEntitiesMutation()

  const handleUpdateEntities = async (operations: Operation[]) => {
    try {
      await updateEntities({ operations, entityType: 'task' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to update task status')
    }
  }

  const handleTaskFieldChange: TaskFieldChange = (_taskId, key, added, removed) => {
    // filter out allTasksMap to only include tasks that are selected
    let operations: Operation[] = []
    switch (key) {
      case 'status':
        operations = getStatusChangeOperations(selectedTasksData, projectName, added[0])
        break
      case 'assignee':
        operations = getAssigneesChangeOperations(selectedTasksData, projectName, added, removed)
        break
      case 'priority':
        operations = getPriorityChangeOperations(selectedTasksData, projectName, added[0])
        break
      default:
        break
    }

    handleUpdateEntities(operations)
  }

  const handleTaskSelect = (id: string, meta: boolean, shift: boolean) => {
    const newIds = []

    if (shift) {
      // get correct index of the selected task
      const tableEl = tableRef.current?.getTable()

      if (!tableEl) return

      const taskIds = resolveShiftSelect(id, tableEl)
      // update main context focused tasks

      dispatch(setFocusedTasks({ ids: taskIds }))
      // update progress state focused tasks (used for the details panel)
      dispatch(selectProgress({ ids: taskIds, type: 'task' }))
      return
    }

    let newActiveId: string | null = id
    if (!meta) {
      // single select
      newIds.push(id)
    } else if (selectedTasks.includes(id)) {
      // remove the task from the selected tasks
      newIds.push(...selectedTasks.filter((taskId) => taskId !== id))
      // change active task to the last selected task else to null
      newActiveId = newIds[newIds.length - 1] || null
    } else {
      // add the task to the selected tasks
      newIds.push(...selectedTasks, id)
    }

    setActiveTask(newActiveId)

    // update main context focused tasks
    dispatch(setFocusedTasks({ ids: newIds }))
    // update progress state focused tasks (used for the details panel)
    dispatch(selectProgress({ ids: newIds, type: 'task' }))
  }

  const handleExpandToggle = (folderId: string) => {
    // check current state of the folderId
    const isExpanded =
      (expandedRows.includes(folderId) || expandAll) && !collapsedRows.includes(folderId)
    // update the expanded rows by either adding or removing the folderId
    const newExpandedRows = [...expandedRows]
    const newCollapsedRows = [...collapsedRows]

    if (isExpanded) {
      // remove from expanded rows
      newExpandedRows.splice(newExpandedRows.indexOf(folderId), 1)
      // add to collapsed rows
      newCollapsedRows.push(folderId)
    } else {
      // add to expanded rows
      newExpandedRows.push(folderId)
      // remove from collapsed rows
      newCollapsedRows.splice(newCollapsedRows.indexOf(folderId), 1)
    }

    setExpandedRows(newExpandedRows)
    setCollapsedRows(newCollapsedRows)

    if (!expandedRows.length && expandAll) {
      const allTasksLength = tableData.filter((row) => !row.__isParent).length
      if (allTasksLength === newCollapsedRows.length) {
        setExpandAll(false)
      }
    }
  }

  const viewerIsOpen = useSelector((state: $Any) => state.viewer.isOpen)
  const openInViewer = ({
    taskId,
    folderId,
    quickView,
  }: {
    taskId?: string
    folderId?: string
    quickView?: boolean
  }) => {
    if ((taskId || folderId) && !viewerIsOpen) {
      dispatch(openViewer({ taskId, folderId, projectName: projectName, quickView }))
    }
  }

  const handleExpandAllToggle = () => {
    // reset all collapsed and expanded rows
    setCollapsedRows([])
    setExpandedRows([])
    // set expand all to the opposite of the current state
    setExpandAll(!expandAll)
  }

  const handleCollapseToggle = (id: string) => {
    // update the collapsed rows by either adding or removing the folderId
    setCollapsedParents((prev) => {
      if (prev.includes(id)) {
        return prev.filter((folderId) => folderId !== id)
      }
      return [...prev, id]
    })
  }

  const shortcuts = [
    {
      key: 'E',
      action: handleExpandAllToggle,
    },
  ]

  return (
    <>
      {/* @ts-ignore */}
      <Shortcuts shortcuts={shortcuts} deps={[expandedRows]} />
      <Section style={{ height: '100%' }} direction="column">
        <Toolbar>
          <SearchFilterWrapper
            filters={filtersWithHierarchy}
            onChange={handleFiltersChange}
            filterTypes={searchFilterTypes}
            projectNames={[projectName]}
            scope="task"
            data={{
              tags: filterTagsData,
              attributes: filterAttributesData,
              assignees: filterAssigneesData,
            }}
            disabledFilters={sliceType ? [sliceType] : []}
          />
          <Spacer />
          <Button
            onClick={handleExpandAllToggle}
            icon={expandAll ? 'collapse_all' : 'expand_all'}
            style={{ minWidth: 220, justifyContent: 'flex-start' }}
            selected={expandAll}
          >
            {`${expandAll ? 'Collapse' : 'Expand'} all rows`}
            <ShortcutTag style={{ marginLeft: 'auto' }}>Shift + E</ShortcutTag>
          </Button>
        </Toolbar>
        {folderIdsToFetch.length ? (
          tableData.length || isFetchingTasks ? (
            <TasksProgressTable
              tableRef={tableRef}
              tableData={tableData}
              projectName={projectName}
              isLoading={isFetchingTasks}
              activeTask={activeTask}
              selectedAssignees={selectedAssignees}
              statuses={statuses} // status icons etc.
              taskTypes={taskTypes} // for tasks icon etc.
              priorities={priorities} // for priority icons and colors
              users={users}
              onChange={handleTaskFieldChange}
              onSelection={handleTaskSelect}
              allExpanded={expandAll}
              expandedRows={expandedRows}
              collapsedRows={collapsedRows}
              onExpandRow={handleExpandToggle}
              onOpenViewer={openInViewer}
              collapsedParents={collapsedParents}
              onCollapseRow={handleCollapseToggle}
            />
          ) : (
            <EmptyPlaceholder message={getPlaceholderMessage(sliceType)} icon="folder_open" />
          )
        ) : (
          <EmptyPlaceholder
            message={'Select a folder to begin.'}
            icon="folder_open"
            error={error}
          />
        )}
      </Section>
    </>
  )
}

export default TasksProgress
