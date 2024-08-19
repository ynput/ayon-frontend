import { useRef, useState } from 'react'
// Prime react
import { DataTable, DataTableBaseProps } from 'primereact/datatable'
import { Column } from 'primereact/column'
// libraries
import styled from 'styled-components'
// components
import { FolderBody, TaskColumnHeader, TaskTypeCell } from '.'

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

export const Cells = styled.div`
  display: flex;
`

export type TaskFieldChange = (
  task: string,
  key: 'status' | 'assignee' | 'priority',
  added: string[],
  removed: string[],
) => void

interface TasksProgressTableProps extends Omit<DataTableBaseProps<any>, 'onChange'> {
  tableData: FolderRow[]
  selectedAssignees: string[]
  highlightedTasks: string[]
  statuses: Status[]
  users: GetAllProjectUsersAsAssigneeResult
  taskTypes: TaskType[]
  onChange: TaskFieldChange
  onSelection: (taskId: string, isMultiSelect: boolean) => void
}

export const TasksProgressTable = ({
  tableData = [],
  selectedAssignees = [],
  highlightedTasks = [],
  statuses = [], // project statuses schema
  taskTypes = [], // project task types schema
  users = [], // users in the project
  onChange,
  onSelection,
  ...props
}: TasksProgressTableProps) => {
  const tableRef = useRef<any>(null)
  const selectedTasks = useSelector((state: $Any) => state.context.focused.tasks) as string[]
  const dispatch = useDispatch()
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const handleExpandToggle = (folderId: string) => {
    // update the expanded rows by either adding or removing the folderId
    setExpandedRows((prev) => {
      if (prev.includes(folderId)) {
        return prev.filter((id) => id !== folderId)
      }
      return [...prev, folderId]
    })
  }

  // for all columns that have taskType as a key, create a new column
  const taskTypeKeys: string[] = []

  tableData.forEach((folderRow) => {
    Object.keys(folderRow).forEach((key) => {
      const value = folderRow[key]
      if (
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

  const tableWrapperEl = (tableRef.current?.getElement() as HTMLElement)?.querySelector(
    '.p-datatable-wrapper',
  )

  const widthBreakPoints = [170, 150, 130]

  return (
    <DataTable
      ref={tableRef}
      value={tableData}
      scrollable
      scrollHeight="flex"
      sortField="_folder"
      sortOrder={1}
      sortMode="single"
      pt={{ thead: { style: { zIndex: 101 } } }}
      {...props}
    >
      <Column
        field="_folder"
        header="Folder"
        frozen
        style={{ zIndex: 100 }}
        body={(row: FolderRow) => (
          <FolderBody
            name={row._folder}
            isExpanded={expandedRows.includes(row.__folderId)}
            onExpandToggle={() => handleExpandToggle(row.__folderId)}
          />
        )}
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
              <Cells key={taskTypeKey}>
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
                    onSelection(task.id, e.metaKey || e.ctrlKey || e.shiftKey)
                  }

                  // handle hitting enter on the cell
                  const handleCellKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter') {
                      onSelection(task.id, e.metaKey || e.ctrlKey || e.shiftKey)
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
                  const isHighlighted = highlightedTasks.includes(task.id)

                  const minWidth =
                    widthBreakPoints[Math.min(widthBreakPoints.length - 1, array.length)]

                  return (
                    <InView
                      root={tableWrapperEl}
                      rootMargin="200px 200px 200px 200px"
                      key={task.id}
                    >
                      {({ inView, ref }) => (
                        <div key={task.id} ref={ref} style={{ display: 'flex', width: '100%' }}>
                          {inView ? (
                            <TaskTypeCell
                              isSelected={isSelected}
                              isHighlighted={isHighlighted}
                              isMultipleSelected={selectedTasks.length > 1}
                              onClick={handleCellClick}
                              onKeyDown={handleCellKeyDown}
                              onDoubleClick={handleCellDoubleClick}
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
