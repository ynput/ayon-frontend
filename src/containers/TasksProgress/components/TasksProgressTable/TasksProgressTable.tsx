// Prime react
import { DataTable, DataTableBaseProps, DataTableColumnResizeEndEvent } from 'primereact/datatable'
import { Column } from 'primereact/column'
// libraries
import styled from 'styled-components'
// components
import { FolderBody, TaskColumnHeader, TasksProgressLoadingTable, TaskTypeCell } from '..'

// state
import { useDispatch, useSelector } from 'react-redux'
import { toggleDetailsPanel } from '@state/details'
// types
import type { Status, TaskType } from '@api/rest'
import type { FolderRow, TaskTypeRow } from '../../helpers/formatTaskProgressForTable'
import type { GetAllProjectUsersAsAssigneeResult } from '@queries/user/getUsers'
import type { KeyboardEvent, MouseEvent } from 'react'
import { $Any } from '@types'
import { InView } from 'react-intersection-observer'
import useCreateContext from '@hooks/useCreateContext'
import { Body } from '../FolderBody/FolderBody.styled'
import clsx from 'clsx'
import ParentBody from '../ParentBody/ParentBody'
import { completeSort, folderSort } from '../../helpers'
import useLocalStorage from '@hooks/useLocalStorage'

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
  selectedFolders: string[]
  activeTask: string | null
  selectedAssignees: string[]
  statuses: Status[]
  taskTypes: TaskType[]
  users: GetAllProjectUsersAsAssigneeResult
  expandedRows: string[]
  onExpandRow: (folderId: string) => void
  onChange: TaskFieldChange
  onSelection: (taskId: string, meta: boolean, shift: boolean) => void
  onOpenViewer: (taskId: string, quickView: boolean) => void
}

export const TasksProgressTable = ({
  tableRef,
  tableData = [],
  projectName,
  isLoading,
  selectedFolders = [],
  activeTask,
  selectedAssignees = [],
  statuses = [], // project statuses schema
  taskTypes = [], // project task types schema
  users = [], // users in the project
  expandedRows = [],
  onExpandRow,
  onChange,
  onSelection,
  onOpenViewer,
  ...props
}: TasksProgressTableProps) => {
  const selectedTasks = useSelector((state: $Any) => state.context.focused.tasks) as string[]
  const dispatch = useDispatch()

  // for all columns that have taskType as a key, create a new column
  const taskTypeKeys: string[] = []
  // how many tasks are in each task type row
  const allTaskTypeTasksNumber: { [key: string]: number[] } = {}
  const taskTypeAverageTasksNumber: { [key: string]: number } = {}

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
        // update the average number of tasks for that task type (rounded)
        const average =
          allTaskTypeTasksNumber[value.taskType].reduce((a, b) => a + b, 0) /
          allTaskTypeTasksNumber[value.taskType].length

        taskTypeAverageTasksNumber[value.taskType] = Math.round(average * 10) / 10
      }
    })
  })

  const onOpenPanel = () => {
    dispatch(toggleDetailsPanel(true))
  }

  const buildContextMenu = (_selection: string[], taskId: string) => {
    return [
      {
        label: 'Show details',
        icon: 'dock_to_left',
        shortcut: 'Double click',
        command: () => onOpenPanel(),
      },
      {
        label: 'Open in viewer',
        icon: 'play_circle',
        shortcut: 'Spacebar',
        command: () => onOpenViewer(taskId, false),
      },
    ]
  }

  const [ctxMenuShow] = useCreateContext()

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

  const localStorageKey = `tasks-progress-table-${projectName}`
  const [savedWidths, setSavedWidths] = useLocalStorage(localStorageKey, null) as [
    { [task: string]: number | null } | null,
    (value: { [task: string]: number | null }) => void,
  ]

  const resolveColumnWidth = (taskType: string, useDefault?: boolean) => {
    const savedWidth = savedWidths?.[taskType]
    const defaultWidth = taskTypeAverageTasksNumber[taskType] * 150
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
    setSavedWidths({ ...savedWidths, [taskType]: newWidth })
  }

  const resetColumnWidth = (taskType?: string) => {
    if (!taskType) return console.error('Width reset error: No task type found')
    taskType && setSavedWidths({ ...savedWidths, [taskType]: null })
    // BUG: The tables own widths are not being reset and so a page refresh is required to reset the widths
    // BEST IDEA: fork the primereact datatable and add a reset button to the column headers
  }

  const tableWrapperEl = (tableRef.current?.getElement() as HTMLElement)?.querySelector(
    '.p-datatable-wrapper',
  )

  if (isLoading) return <TasksProgressLoadingTable rows={selectedFolders.length} />

  return (
    <DataTable
      ref={tableRef}
      value={tableData}
      resizableColumns
      columnResizeMode="expand"
      onColumnResizeEnd={handleColumnResize}
      onColumnResizerDoubleClick={(e) => resetColumnWidth(e.column.props.field)}
      scrollable
      scrollHeight="flex"
      sortField="__folderKey"
      sortOrder={1}
      sortMode="single"
      style={{ overflow: 'hidden' }}
      pt={{ thead: { style: { zIndex: 101, height: 36 } } }}
      className="tasks-progress-table"
      {...props}
    >
      <Column
        field="__folderKey"
        header="Folder"
        frozen
        resizeable
        sortable
        sortFunction={folderSort}
        style={{ zIndex: 100, minWidth: 300 }}
        body={(row: FolderRow) =>
          row.__isParent ? (
            <ParentBody name={row._folder} />
          ) : (
            <FolderBody
              name={row._folder}
              parents={row._parents}
              folderId={row.__folderId}
              folderIcon={row._folderIcon}
              projectName={row.__projectName}
              isLoading={false}
              isExpanded={expandedRows.includes(row.__folderId)}
              onExpandToggle={() => onExpandRow(row.__folderId)}
            />
          )
        }
      />
      <Column
        field={'_complete'}
        header={'Complete'}
        body={(row: FolderRow) => (
          <Body style={{ minWidth: 'unset' }}>
            <span>{`${row._complete}%`}</span>
          </Body>
        )}
        sortable
        sortFunction={completeSort}
      />
      {taskTypeKeys.map((taskTypeKey) => (
        <Column
          key={taskTypeKey}
          field={taskTypeKey}
          resizeable
          header={<TaskColumnHeader taskType={taskTypeKey} />}
          pt={{ bodyCell: { style: { padding: 0 } } }}
          className="column task-column"
          headerClassName="column-header task-column-header"
          body={(rowData) => {
            const taskCellData = rowData[taskTypeKey] as TaskTypeRow
            const taskType = taskTypes.find((t) => t.name === taskTypeKey)
            if (!taskCellData) return null

            const width = resolveColumnWidth(taskTypeKey)

            return (
              <Cells key={taskTypeKey} className="cells" style={{ width: width }}>
                {taskCellData.tasks.map((task) => {
                  // add avatarUrl to each user
                  const assigneeOptions = users.map((user) => ({
                    ...user,
                    avatarUrl: `/api/users/${user.name}/avatar`,
                  }))
                  const isExpanded = expandedRows.includes(task.folder.id)

                  const handleCellClick = (e: MouseEvent<HTMLDivElement>) => {
                    // check if the click is editable item
                    const target = e.target as HTMLElement
                    if (target.closest('.editable')) {
                      return
                    }
                    onSelection(task.id, e.metaKey || e.ctrlKey, e.shiftKey)
                  }

                  // handle hitting enter on the cell
                  const handleCellKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter') {
                      onSelection(task.id, e.metaKey || e.ctrlKey, e.shiftKey)
                    }
                    if (e.key === ' ') {
                      e.preventDefault()
                      onOpenViewer(task.id, true)
                    }
                  }

                  const handleCellDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
                    // check if the click is editable item
                    const target = e.target as HTMLElement
                    if (target.closest('.editable')) {
                      return
                    }
                    onOpenPanel()
                  }

                  const isSelected = selectedTasks.includes(task.id)
                  const isActive = activeTask === task.id

                  return (
                    <InView
                      root={tableWrapperEl}
                      rootMargin="200px 200px 200px 200px"
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
