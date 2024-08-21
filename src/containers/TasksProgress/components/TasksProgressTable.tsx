// Prime react
import { DataTable, DataTableBaseProps } from 'primereact/datatable'
import { Column } from 'primereact/column'
// libraries
import styled from 'styled-components'
// components
import { FolderBody, TaskColumnHeader, TasksProgressLoadingTable, TaskTypeCell } from '.'

// state
import { useDispatch, useSelector } from 'react-redux'
import { toggleDetailsPanel } from '@state/details'
// types
import type { Status, TaskType } from '@api/rest'
import type { FolderRow, TaskTypeRow } from '../helpers/formatTaskProgressForTable'
import type { GetAllProjectUsersAsAssigneeResult } from '@queries/user/getUsers'
import type { KeyboardEvent, MouseEvent } from 'react'
import { $Any } from '@types'
import { InView } from 'react-intersection-observer'
import useCreateContext from '@hooks/useCreateContext'
import { Body } from './FolderBody/FolderBody.styled'
import clsx from 'clsx'
import ParentBody from './ParentBody/ParentBody'

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

  tableData.forEach((folderRow) => {
    Object.keys(folderRow).forEach((key) => {
      const value = folderRow[key]
      if (
        value &&
        typeof value === 'object' &&
        'taskType' in value &&
        !taskTypeKeys.includes(value.taskType)
      ) {
        taskTypeKeys.push(value.taskType)
      }
    })
  })

  const onOpenPanel = () => {
    dispatch(toggleDetailsPanel(true))
  }

  const buildContextMenu = (_selection: string[], taskId: string) => {
    return [
      {
        label: 'Open in side panel',
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

  const tableWrapperEl = (tableRef.current?.getElement() as HTMLElement)?.querySelector(
    '.p-datatable-wrapper',
  )

  const widthBreakPoints = [170, 150, 130]

  if (isLoading) return <TasksProgressLoadingTable rows={selectedFolders.length} />

  return (
    <DataTable
      ref={tableRef}
      value={tableData}
      scrollable
      scrollHeight="flex"
      sortField="__folderKey"
      sortOrder={1}
      sortMode="single"
      style={{ overflow: 'hidden' }}
      pt={{ thead: { style: { zIndex: 101, height: 36 } } }}
      {...props}
    >
      <Column
        field="__folderKey"
        header="Folder"
        frozen
        sortable
        style={{ zIndex: 100 }}
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
      />
      {taskTypeKeys.map((taskTypeKey) => (
        <Column
          key={taskTypeKey}
          field={taskTypeKey}
          header={<TaskColumnHeader taskType={taskTypeKey} />}
          pt={{ bodyCell: { style: { padding: 0 } } }}
          body={(rowData) => {
            const taskCellData = rowData[taskTypeKey] as TaskTypeRow
            const taskType = taskTypes.find((t) => t.name === taskTypeKey)
            if (!taskCellData) return null

            return (
              <Cells key={taskTypeKey} className="cells">
                {taskCellData.tasks.map((task, _i, array) => {
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

                  const minWidth =
                    widthBreakPoints[Math.min(widthBreakPoints.length - 1, array.length)]

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
                              style={{
                                minWidth: minWidth,
                              }}
                              task={task}
                              selectedAssignees={selectedAssignees}
                              assigneeOptions={assigneeOptions}
                              isExpanded={isExpanded}
                              taskIcon={taskType?.icon || ''}
                              statuses={statuses}
                              onChange={onChange}
                            />
                          ) : (
                            <div
                              style={{ height: isExpanded ? 118 : 42, flex: 1, minWidth: minWidth }}
                            ></div>
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
