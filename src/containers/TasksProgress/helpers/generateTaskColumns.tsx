import { Column } from 'primereact/column'
import { FolderRow, TaskTypeRow } from './formatTaskProgressForTable'
import { EntityCard, EntityCardProps } from '@ynput/ayon-react-components'
import { TaskColumnHeader, TaskTypeCell } from '../components'
import { Status, TaskType } from '@api/rest'
import { GetAllProjectUsersAsAssigneeResult } from '@queries/user/getUsers'
import styled from 'styled-components'
import { MouseEvent } from 'react'

export const Cells = styled.div`
  display: flex;
`

export type TaskFieldChange = (
  taskId: string,
  key: 'status' | 'assignee' | 'priority',
  value: string[],
) => void

type GenerateTaskColumnsProps = {
  tableData: FolderRow[]
  statuses: Status[]
  users: GetAllProjectUsersAsAssigneeResult
  taskTypes: TaskType[]
  expandedRows: string[]
  selectedTasks: string[]
  onSelectTask: (id: string, multiSelect: boolean) => void
  onChange: TaskFieldChange
}

export const generateTaskColumns = ({
  tableData = [],
  statuses = [], // project statuses schema
  taskTypes = [], // project task types schema
  users = [], // users in the project
  expandedRows = [],
  selectedTasks = [],
  onSelectTask,
  onChange,
}: GenerateTaskColumnsProps) => {
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

  const columns = taskTypeKeys.map((taskTypeKey) => {
    return (
      <Column
        key={taskTypeKey}
        field={taskTypeKey}
        header={<TaskColumnHeader taskType={taskTypeKey} />}
        headerStyle={{ minWidth: 60 }}
        pt={{ bodyCell: { style: { padding: 0 } } }}
        body={(rowData) => {
          const taskCellData = rowData[taskTypeKey] as TaskTypeRow
          const taskType = taskTypes.find((t) => t.name === taskTypeKey)
          if (!taskCellData) return null
          return (
            <Cells key={taskTypeKey}>
              {taskCellData.tasks.map((task) => {
                const status = statuses.find((s) => s.name === task.status)
                // add avatarUrl to each user
                const assigneeOptions = users.map((user) => ({
                  ...user,
                  avatarUrl: `/api/users/${user.name}/avatar`,
                }))

                const thumbnailUrl = `/api/projects/${rowData.__projectName}/tasks/${task.id}/thumbnail?updatedAt=${task.updatedAt}`

                const isExpanded = expandedRows.includes(rowData.__folderId)

                let changeProps: {
                  onAssigneeChange?: EntityCardProps['onAssigneeChange']
                  onStatusChange?: EntityCardProps['onStatusChange']
                  onPriorityChange?: EntityCardProps['onPriorityChange']
                } = {
                  onAssigneeChange: undefined,
                  onStatusChange: undefined,
                  onPriorityChange: undefined,
                }

                const isSelected = selectedTasks.includes(task.id)

                if (isSelected) {
                  changeProps = {
                    onAssigneeChange: (a) => onChange(task.id, 'assignee', a),
                    onStatusChange: (s) => onChange(task.id, 'status', s),
                    onPriorityChange: (p) => onChange(task.id, 'priority', p),
                  }
                }

                const handleCellClick = (e: MouseEvent<HTMLDivElement>) => {
                  // check if the click is editable item
                  const target = e.target as HTMLElement
                  if (target.closest('.editable')) {
                    return
                  }
                  onSelectTask(task.id, e.metaKey || e.ctrlKey || e.shiftKey)
                }

                return (
                  <TaskTypeCell key={task.id} onClick={handleCellClick} isSelected={isSelected}>
                    <EntityCard
                      variant="status"
                      title={task.label || task.name}
                      titleIcon={taskType?.icon}
                      imageUrl={isExpanded ? thumbnailUrl : undefined}
                      users={task.assignees.map((assignee: string) => ({ name: assignee }))}
                      assigneeOptions={assigneeOptions}
                      status={status}
                      statusOptions={statuses}
                      statusMiddle
                      statusNameOnly
                      priority={{
                        name: 'high',
                        icon: 'keyboard_double_arrow_up',
                        label: 'High',
                        color: '#ff0000',
                      }}
                      {...changeProps}
                      style={{ width: 'unset', aspectRatio: 'unset' }}
                      isCollapsed={!isExpanded}
                      isActive
                    />
                  </TaskTypeCell>
                )
              })}
            </Cells>
          )
        }}
      />
    )
  })
  return columns
}
