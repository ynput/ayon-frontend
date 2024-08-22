import { Status } from '@api/rest'
import { TaskTypeStatusBar } from '@containers/TasksProgress/helpers/formatTaskProgressForTable'
import { FC } from 'react'
import * as Styled from './TaskStatusBar.styled'

interface TaskStatusBarProps {
  statuses: Status[]
  statusCounts: TaskTypeStatusBar
}

export const TaskStatusBar: FC<TaskStatusBarProps> = ({ statuses = [], statusCounts = {} }) => {
  const stateOrder = ['done', 'in_progress', 'blocked', 'not_started']
  const lastState = stateOrder[stateOrder.length - 1]
  // sort statuses by state
  const sortedStatuses = [...statuses].sort(
    (a, b) => stateOrder.indexOf(a.state || lastState) - stateOrder.indexOf(b.state || lastState),
  )

  return (
    <Styled.Cell>
      <Styled.StatusBar>
        {sortedStatuses.map((status) => {
          const count = statusCounts[status.name] || 0
          return (
            <Styled.Status
              key={status.name}
              style={{ flex: count, backgroundColor: status.color }}
            />
          )
        })}
      </Styled.StatusBar>
    </Styled.Cell>
  )
}
