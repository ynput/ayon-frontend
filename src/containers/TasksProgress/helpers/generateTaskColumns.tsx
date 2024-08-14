import { Column } from 'primereact/column'
import { FolderRow, TaskTypeRow } from './formatTaskProgressForTable'
import { EntityCard } from '@ynput/ayon-react-components'
import { TaskColumnHeader, TaskTypeCell, TaskTypeName } from '../components'
import { Status, TaskType } from '@api/rest'
import { GetAllProjectUsersAsAssigneeResult } from '@queries/user/getUsers'

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
  onChange: TaskFieldChange
}

export const generateTaskColumns = ({
  tableData = [],
  statuses = [], // project statuses schema
  taskTypes = [], // project task types schema
  users = [], // users in the project
  expandedRows = [],
  onChange,
}: GenerateTaskColumnsProps) => {
  // for all columns that have taskType as a key, create a new column
  const taskTypeKeys: string[] = []
  // when a taskType has multiple names, store them here
  const taskTypeNames: Record<string, Set<TaskTypeName>> = {}

  tableData.forEach((folderRow) => {
    Object.keys(folderRow).forEach((key) => {
      const value = folderRow[key]
      if (
        typeof value === 'object' &&
        'taskType' in value &&
        !taskTypeKeys.includes(value.taskType)
      ) {
        taskTypeKeys.push(value.taskType)

        value.tasks.forEach((task) => {
          // store the names of the taskType
          if (!taskTypeNames[value.taskType]) {
            // add new set if it doesn't exist yet
            taskTypeNames[value.taskType] = new Set()
          }
          taskTypeNames[value.taskType].add({ name: task.name, label: task.label })
        })
      }
    })
  })

  const columns = taskTypeKeys.map((taskTypeKey) => {
    return (
      <Column
        key={taskTypeKey}
        field={taskTypeKey}
        header={
          <TaskColumnHeader
            taskType={taskTypeKey}
            taskNames={Array.from(taskTypeNames[taskTypeKey])}
          />
        }
        headerStyle={{ minWidth: 60 }}
        pt={{ headerTitle: { style: { width: '100%' } } }}
        body={(rowData) => {
          const taskCellData = rowData[taskTypeKey] as TaskTypeRow
          const taskType = taskTypes.find((t) => t.name === taskTypeKey)
          if (!taskCellData) return null
          return (
            <TaskTypeCell key={taskTypeKey}>
              {taskCellData.tasks.map((task) => {
                const status = statuses.find((s) => s.name === task.status)
                // add avatarUrl to each user
                const assigneeOptions = users.map((user) => ({
                  ...user,
                  avatarUrl: `/api/users/${user.name}/avatar`,
                }))

                const thumbnailUrl = `/api/projects/${rowData.__projectName}/tasks/${task.id}/thumbnail?updatedAt=${task.updatedAt}`

                const isExpanded = expandedRows.includes(rowData.__folderId)

                return (
                  <EntityCard
                    key={task.id}
                    variant="status"
                    title={task.label || task.name}
                    titleIcon={taskType?.icon}
                    imageUrl={isExpanded ? thumbnailUrl : undefined}
                    users={task.assignees.map((assignee: string) => ({ name: assignee }))}
                    assigneeOptions={assigneeOptions}
                    // onAssigneeChange={(a) => onChange(task.id, 'assignee', a)}
                    status={status}
                    statusOptions={statuses}
                    statusMiddle
                    statusNameOnly
                    // onStatusChange={(s) => onChange(task.id, 'status', s)}
                    priority={{
                      name: 'high',
                      icon: 'keyboard_double_arrow_up',
                      label: 'High',
                      color: '#ff0000',
                    }}
                    // onPriorityChange={(p) => onChange(task.id, 'priority', p)}
                    style={{ width: 'unset', flex: '1', aspectRatio: 'unset' }}
                    isCollapsed={!isExpanded}
                    isActive
                  />
                )
              })}
            </TaskTypeCell>
          )
        }}
      />
    )
  })
  return columns
}
