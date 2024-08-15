import { forwardRef, useState } from 'react'
// Prime react
import { DataTable, DataTableBaseProps } from 'primereact/datatable'
import { Column } from 'primereact/column'
// libraries
import styled from 'styled-components'
// components
import { FolderBody, TaskColumnHeader, TaskTypeCell } from '.'

// state
import { useDispatch } from 'react-redux'
import { toggleDetailsPanel } from '@state/details'
// types
import type { Status, TaskType } from '@api/rest'
import type { FolderRow, TaskTypeRow } from '../helpers/formatTaskProgressForTable'
import type { GetAllProjectUsersAsAssigneeResult } from '@queries/user/getUsers'
import type { KeyboardEvent, MouseEvent } from 'react'

export const Cells = styled.div`
  display: flex;
`

export type TaskFieldChange = (
  taskId: string,
  key: 'status' | 'assignee' | 'priority',
  value: string[],
) => void

interface TasksProgressTableProps extends Omit<DataTableBaseProps<any>, 'onChange'> {
  tableData: FolderRow[]
  statuses: Status[]
  users: GetAllProjectUsersAsAssigneeResult
  taskTypes: TaskType[]
  onChange: TaskFieldChange
  onSelection: (taskId: string, isMultiSelect: boolean) => void
}

export const TasksProgressTable = forwardRef<DataTable<any>, TasksProgressTableProps>(
  (
    {
      tableData = [],
      statuses = [], // project statuses schema
      taskTypes = [], // project task types schema
      users = [], // users in the project
      onChange,
      onSelection,
      ...props
    },
    ref,
  ) => {
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

    return (
      <DataTable
        ref={ref}
        value={tableData}
        scrollable
        scrollHeight="flex"
        virtualScrollerOptions={{ itemSize: 42 }}
        sortField="_folder"
        sortOrder={1}
        sortMode="single"
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

                    const widthBreakPoints = [170, 150, 130]
                    return (
                      <TaskTypeCell
                        key={task.id}
                        onClick={handleCellClick}
                        onKeyDown={handleCellKeyDown}
                        onDoubleClick={handleCellDoubleClick}
                        tabIndex={0}
                        style={{
                          minWidth:
                            widthBreakPoints[
                              Math.min(widthBreakPoints.length - 1, array.length - 1)
                            ],
                        }}
                        task={task}
                        assigneeOptions={assigneeOptions}
                        isExpanded={isExpanded}
                        taskIcon={taskType?.icon || ''}
                        statuses={statuses}
                        onChange={onChange}
                      />
                    )
                  })}
                </Cells>
              )
            }}
          />
        ))}
      </DataTable>
    )
  },
)
