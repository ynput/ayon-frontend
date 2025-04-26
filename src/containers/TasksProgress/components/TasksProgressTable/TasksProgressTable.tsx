// PrimeReact components
import { DataTable, DataTableBaseProps, DataTableColumnResizeEndEvent } from 'primereact/datatable'
import { Column } from 'primereact/column'

// Styling
import styled from 'styled-components'
import './TaskProgressTable.scss'

// Components
import {
  FolderBody,
  TaskColumnHeader,
  TasksProgressLoadingTable,
  TaskStatusBar,
  TaskTypeCell,
} from '..'
import ParentBody from '../ParentBody/ParentBody'
import { Body } from '../FolderBody/FolderBody.styled'

// State management
import { useAppDispatch, useAppSelector } from '@state/store'
import { selectProgress, toggleDetailsOpen } from '@state/progress'
import { setFocusedTasks } from '@state/context'

// Types
import type { Status, TaskType } from '@api/rest/project'
import type {
  FolderRow,
  TaskTypeRow,
  TaskTypeStatusBar,
} from '../../helpers/formatTaskProgressForTable'
import type { Assignees } from '@queries/user/getUsers'
import { AttributeEnumItem } from '@api/rest/attributes'

// Hooks
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { InView } from 'react-intersection-observer'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useLocalStorage } from '@shared/hooks'

// Helpers
import { useFolderSort } from '../../hooks'
import { taskStatusSortFunction } from '@containers/TasksProgress/helpers/taskStatusSortFunction'
import clsx from 'clsx'
import { useEntityListsContext } from '@pages/ProjectListsPage/context/EntityListsContext'

export const Cells = styled.div`
  display: flex;
`

export type TaskFieldChange = (
  task: string,
  key: 'status' | 'assignee' | 'priority',
  added: string[],
  removed: string[],
) => void

interface TasksProgressTableProps
  extends Omit<DataTableBaseProps<any>, 'onChange' | 'expandedRows'> {
  tableRef: React.RefObject<any>
  tableData: FolderRow[]
  projectName: string
  isLoading: boolean
  activeTask: string | null
  selectedAssignees: string[]
  statuses: Status[]
  taskTypes: TaskType[]
  priorities: AttributeEnumItem[]
  users: Assignees
  allExpanded: boolean
  expandedRows: string[]
  collapsedRows: string[]
  onExpandRow: (folderId: string) => void
  collapsedParents: string[]
  onCollapseRow: (folderId: string) => void
  onChange: TaskFieldChange
  onSelection: (taskId: string, meta: boolean, shift: boolean) => void
  onOpenViewer: ({
    taskId,
    folderId,
    quickView,
  }: {
    taskId?: string
    folderId?: string
    quickView?: boolean
  }) => void
}

export const TasksProgressTable = ({
  tableRef,
  tableData = [],
  projectName,
  isLoading,
  activeTask,
  selectedAssignees = [],
  statuses = [], // project statuses schema
  taskTypes = [], // project task types schema
  priorities = [], // project priorities schema
  users = [], // users in the project
  allExpanded,
  expandedRows = [],
  collapsedRows = [],
  onExpandRow,
  collapsedParents = [],
  onCollapseRow,
  onChange,
  onSelection,
  onOpenViewer,
  ...props
}: TasksProgressTableProps) => {
  const selectedTasks = useAppSelector((state) => state.context.focused.tasks) as string[]
  const progressSelected = useAppSelector((state) => state.progress.selected)
  const detailsOpen = useAppSelector((state) => state.details.open)
  const dispatch = useAppDispatch()

  // HACK: this forces a complete rerender of the table
  // used for resetting the column widths
  const [reloadTable, setReloadTable] = useState(false)
  const forceReloadTable = () => setReloadTable(true)
  useEffect(() => {
    if (!reloadTable) return

    // timeout to reset reloadTable after 1 second
    const timeout = setTimeout(() => {
      setReloadTable(false)
    }, 0)

    return () => clearTimeout(timeout)
  }, [reloadTable])

  // for all columns that have taskType as a key, create a new column
  const taskTypeKeys: string[] = []
  // how many tasks are in each task type row
  const allTaskTypeTasksNumber: { [key: string]: number[] } = {}
  const taskTypeMajorityTasksNumber: { [key: string]: number } = {}

  tableData.forEach((folderRow) => {
    // skip parent folders
    if (folderRow.__isParent) return
    Object.keys(folderRow).forEach((key) => {
      const value = folderRow[key]
      if (value && typeof value === 'object' && 'taskType' in value) {
        if (!taskTypeKeys.includes(value.taskType)) {
          taskTypeKeys.push(value.taskType)
        }

        // update the number of tasks in each task type
        // first create an array for each task type if it doesn't exist
        if (!allTaskTypeTasksNumber[value.taskType]) {
          allTaskTypeTasksNumber[value.taskType] = []
        }
        const tasksLength = value.tasks.length
        // add the number of tasks to the array for that rows task type
        allTaskTypeTasksNumber[value.taskType].push(tasksLength)
        // Calculate the majority number of tasks for each task type
        const taskTypeTasksNumber = allTaskTypeTasksNumber[value.taskType]
        const taskTypeTasksCount: { [key: number]: number } = {}
        let maxCount = 0
        let majorityTasksNumber = 0

        // Count the number of tasks for each task type
        taskTypeTasksNumber.forEach((tasksLength) => {
          // Initialize count for tasks length if it doesn't exist
          if (!taskTypeTasksCount[tasksLength]) {
            taskTypeTasksCount[tasksLength] = 0
          }
          // Increment the count for tasks length
          taskTypeTasksCount[tasksLength]++
          // Update the max count and majority tasks number
          if (taskTypeTasksCount[tasksLength] > maxCount) {
            maxCount = taskTypeTasksCount[tasksLength]
            majorityTasksNumber = tasksLength
          } else if (
            taskTypeTasksCount[tasksLength] === maxCount &&
            tasksLength > majorityTasksNumber
          ) {
            majorityTasksNumber = tasksLength
          }
        })

        taskTypeMajorityTasksNumber[value.taskType] = majorityTasksNumber
      }
    })
  })

  // sort the taskTypeKeys by the order in the taskTypes array
  taskTypeKeys.sort((a, b) => {
    const aIndex = taskTypes.findIndex((t) => t.name === a)
    const bIndex = taskTypes.findIndex((t) => t.name === b)
    return aIndex - bIndex
  })

  const sortFolderFunction = useFolderSort(tableData)

  const togglePanel = (open: boolean = true) => {
    dispatch(toggleDetailsOpen(open))
  }

  const { buildAddToListMenu, buildListMenuItem, tasks: tasksLists } = useEntityListsContext()

  const buildContextMenu = (selection: string[], taskId: string) => {
    return [
      {
        label: detailsOpen ? 'Hide details' : 'Show details',
        icon: 'dock_to_left',
        shortcut: detailsOpen ? 'Escape' : 'Double click',
        command: () => togglePanel(!detailsOpen),
      },
      {
        label: 'Open in viewer',
        icon: 'play_circle',
        shortcut: 'Spacebar',
        command: () => onOpenViewer({ taskId, quickView: true }),
      },
      buildAddToListMenu(
        tasksLists.data.map((list) =>
          buildListMenuItem(
            list,
            selection.map((id) => ({ id, entityType: 'task' })),
          ),
        ),
      ),
    ]
  }

  const [ctxMenuShow] = useCreateContextMenu()

  const handleContextMenu = (e: MouseEvent<HTMLDivElement>, taskId: string) => {
    // check if the click is within selection already
    let selection = selectedTasks
    const inSelection = selectedTasks.includes(taskId)
    // if not in selection, clear selection and select the task
    if (!inSelection) {
      selection = [taskId]
      // update the selection
      onSelection(taskId, false, false)
    }

    // show context menu
    ctxMenuShow(e, buildContextMenu(selection, taskId))
  }

  type SavedWidths = { [task: string]: number | null }

  const localStorageKey = `tasks-progress-table-${projectName}`
  const [savedWidths, setSavedWidths] = useLocalStorage<SavedWidths | null>(localStorageKey, null)

  const resolveColumnWidth = (taskType: string, useDefault?: boolean) => {
    const screenWidthMultiple = (min: number, max: number, target: number): number => {
      // target is percentage of the screen width
      const screenWidth = window.innerWidth
      const width = screenWidth * (target / 100)
      return Math.round(Math.min(max, Math.max(min, width)))
    }

    const savedWidth = savedWidths?.[taskType]
    const fullWidth = screenWidthMultiple(180, 250, 13)
    const compactWidth = screenWidthMultiple(80, 150, 10)
    const minWidthPerTask = detailsOpen ? compactWidth : fullWidth
    const defaultWidth = taskTypeMajorityTasksNumber[taskType] * minWidthPerTask
    if (useDefault) return defaultWidth
    return savedWidth || defaultWidth
  }

  const handleColumnResize = (e: DataTableColumnResizeEndEvent) => {
    const taskType = e.column.props?.field
    if (!taskType) return console.error('Resize error: No task type found')
    // const newWidth = Math.round(e.element.clientWidth)
    const currentWidth = resolveColumnWidth(taskType)
    const delta = e.delta
    const newWidth = currentWidth + delta

    // set the new width to local storage
    setSavedWidths({
      ...savedWidths,
      [taskType]: newWidth,
    })
  }

  const resetColumnWidth = (taskType?: string) => {
    if (!taskType) return console.error('Width reset error: No task type found')
    // remove taskType from column widths
    const newWidths = { ...savedWidths }
    delete newWidths[taskType]
    taskType && setSavedWidths(newWidths)

    forceReloadTable()
  }

  const tableWrapperEl = (tableRef.current?.getElement() as HTMLElement)?.querySelector(
    '.p-datatable-wrapper',
  )

  const buildColumnHeaderMenuItems = (taskType: string) => [
    {
      label: 'Reset column width',
      icon: 'width',
      command: () => resetColumnWidth(taskType),
    },
  ]

  const handleColumnHeaderContextMenu = (
    e: MouseEvent<HTMLTableCellElement, globalThis.MouseEvent>,
    taskType: string,
  ) => {
    e.preventDefault()
    ctxMenuShow(e, buildColumnHeaderMenuItems(taskType))
  }

  const handleFolderOpen = (folderId: string) => {
    // update the selected progress
    dispatch(selectProgress({ ids: [folderId], type: 'folder' }))
    // remove any selected tasks
    dispatch(setFocusedTasks([]))
    // open the details panel
    togglePanel(true)
  }

  const getIsExpanded = (id: string) =>
    (allExpanded || expandedRows.includes(id)) && !collapsedRows.includes(id)

  if (isLoading) return <TasksProgressLoadingTable rows={20} />

  if (reloadTable) return null

  return (
    <DataTable
      ref={tableRef}
      value={tableData}
      resizableColumns
      columnResizeMode="expand"
      onColumnResizeEnd={handleColumnResize}
      onColumnResizerClick={(e) => e.originalEvent.stopPropagation()}
      onColumnResizerDoubleClick={(e) => {
        e.originalEvent.stopPropagation()
        resetColumnWidth(e.column.props.field)
      }}
      scrollable
      scrollHeight="flex"
      sortField="__folderKey"
      sortOrder={1}
      sortMode="single"
      style={{ overflow: 'hidden' }}
      pt={{
        thead: { style: { zIndex: 101, height: 36 } },
      }}
      className="tasks-progress-table"
      rowClassName={(rowData: FolderRow) => (rowData.__isParent ? 'parent-row' : 'folder-row')}
      {...props}
    >
      <Column
        field="__folderKey"
        header="Folder"
        frozen
        resizeable
        sortable
        sortFunction={sortFolderFunction}
        style={{ zIndex: 100, maxWidth: detailsOpen ? 250 : 300, width: detailsOpen ? 250 : 300 }}
        headerStyle={{ zIndex: 400 }}
        bodyStyle={{ paddingLeft: 0 }}
        body={(row: FolderRow) =>
          row.__isParent ? (
            <ParentBody
              name={row._folder}
              folderCount={row._folderCount}
              taskCount={row._taskCount}
              isCollapsed={collapsedParents.includes(row.__folderId)}
              onCollapseToggle={() => onCollapseRow(row.__folderId)}
            />
          ) : (
            <FolderBody
              folder={{
                id: row.__folderId,
                name: row._folder,
                icon: row.__folderIcon,
                status: statuses.find((s) => s.name === row.__folderStatus),
                updatedAt: row.__folderUpdatedAt,
              }}
              isSelected={
                progressSelected.type === 'folder' && progressSelected.ids.includes(row.__folderId)
              }
              projectName={row.__projectName}
              isExpanded={getIsExpanded(row.__folderId)}
              onExpandToggle={() => onExpandRow(row.__folderId)}
              onFolderOpen={handleFolderOpen}
              onSpaceKey={() => onOpenViewer({ folderId: row.__folderId, quickView: true })}
            />
          )
        }
      />
      <Column
        field={'_complete'}
        header={'Done'}
        style={{ maxWidth: 72, width: 72 }}
        resizeable
        body={(row: FolderRow) =>
          row._complete !== undefined && (
            <Body style={{ minWidth: 'unset' }}>
              <span>{`${Math.round(row._complete * 10) / 10}%`}</span>
            </Body>
          )
        }
        sortable
        sortFunction={sortFolderFunction}
      />
      {taskTypeKeys.map((taskTypeKey) => (
        <Column
          key={taskTypeKey}
          field={taskTypeKey}
          resizeable
          header={<TaskColumnHeader taskType={taskTypeKey} />}
          sortable
          sortFunction={(e) => sortFolderFunction(e, taskStatusSortFunction(statuses))}
          pt={{
            bodyCell: { style: { padding: 0 } },
            headerCell: { onContextMenu: (e) => handleColumnHeaderContextMenu(e, taskTypeKey) },
          }}
          style={{ width: resolveColumnWidth(taskTypeKey) }}
          className={clsx('column', 'task-column', taskTypeKey)}
          headerClassName={clsx('column-header', 'task-column', 'task-column-header', taskTypeKey)}
          body={(rowData) => {
            // the bar at the top with all the status colours
            if (rowData.__isParent) {
              const taskCellData = rowData[taskTypeKey] as TaskTypeStatusBar

              return <TaskStatusBar statuses={statuses} statusCounts={taskCellData} />
            }

            const taskCellData = rowData[taskTypeKey] as TaskTypeRow
            const taskType = taskTypes.find((t) => t.name === taskTypeKey)
            if (!taskCellData) return null

            return (
              <Cells className="cells">
                {taskCellData.tasks.map((task) => {
                  // add avatarUrl to each user
                  const assigneeOptions = users.map((user) => ({
                    ...user,
                    avatarUrl: `/api/users/${user.name}/avatar`,
                  }))

                  const handleCellClick = (e: MouseEvent<HTMLDivElement>) => {
                    // check if the click is editable item
                    const target = e.target as HTMLElement
                    if (target.closest('.editable')) {
                      return
                    }

                    onSelection(task.id, e.metaKey || e.ctrlKey, e.shiftKey)
                  }

                  // handle hitting enter or space on the cell
                  const handleCellKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter') {
                      onSelection(task.id, e.metaKey || e.ctrlKey, e.shiftKey)
                    }
                    if (e.key === ' ') {
                      e.preventDefault()
                      onOpenViewer({ taskId: task.id, quickView: true })
                    }
                  }

                  const handleCellDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
                    // check if the click is editable item
                    const target = e.target as HTMLElement
                    if (target.closest('.editable')) {
                      return
                    }
                    togglePanel()
                  }

                  const isExpanded = getIsExpanded(task.folder?.id)
                  const isSelected = selectedTasks.includes(task.id)
                  const isActive = progressSelected.type === 'task' && activeTask === task.id

                  return (
                    <InView
                      root={tableWrapperEl}
                      rootMargin="100px 100px 100px 100px"
                      key={task.id}
                    >
                      {({ inView, ref }) => (
                        <div
                          key={task.id}
                          ref={ref}
                          style={{ display: 'flex', width: '100%' }}
                          data-task-id={task.id}
                          className={clsx('cell-wrapper', {
                            selected: isSelected,
                            active: isActive,
                          })}
                        >
                          {inView ? (
                            <TaskTypeCell
                              isActive={isActive}
                              isSelected={isSelected}
                              isMultipleSelected={selectedTasks.length > 1}
                              onClick={handleCellClick}
                              onKeyDown={handleCellKeyDown}
                              onDoubleClick={handleCellDoubleClick}
                              onContextMenu={(e) => handleContextMenu(e, task.id)}
                              tabIndex={0}
                              task={task}
                              selectedAssignees={selectedAssignees}
                              assigneeOptions={assigneeOptions}
                              isExpanded={isExpanded}
                              taskIcon={taskType?.icon || ''}
                              statuses={statuses}
                              priorities={priorities}
                              onChange={onChange}
                            />
                          ) : (
                            <div style={{ height: isExpanded ? 118 : 42, flex: 1 }}></div>
                          )}
                        </div>
                      )}
                    </InView>
                  )
                })}
              </Cells>
            )
          }}
        />
      ))}
    </DataTable>
  )
}
