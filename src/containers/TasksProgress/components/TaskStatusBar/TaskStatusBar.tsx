import type { Status } from '@shared/api'
import { TaskTypeStatusBar } from '@containers/TasksProgress/helpers/formatTaskProgressForTable'
import { FC } from 'react'
import * as Styled from './TaskStatusBar.styled'
import { isEmpty } from 'lodash'
import { getTextColor } from '@shared/util'

interface TaskStatusBarProps {
  statuses: Status[]
  statusCounts: TaskTypeStatusBar
}

export const stateOrder = ['done', 'in_progress', 'blocked', 'not_started']

export const TaskStatusBar: FC<TaskStatusBarProps> = ({ statuses = [], statusCounts = {} }) => {
  const lastState = stateOrder[stateOrder.length - 1]
  // sort statuses by state
  const sortedStatuses = [...statuses].sort(
    (a, b) => stateOrder.indexOf(a.state || lastState) - stateOrder.indexOf(b.state || lastState),
  )
  const total = Object.values(statusCounts).reduce((acc, count) => acc + count, 0)

  const tooltip = sortedStatuses
    .filter((status) => statusCounts[status.name] > 0)
    .map((status) => {
      const count = statusCounts[status.name] || 0
      const percentage = Math.round((count / total) * 100 * 10) / 10

      return `${status.name}: ${count} (${percentage}%)`
    })
    .join('\n')

  if (isEmpty(statusCounts)) return null

  return (
    <Styled.Cell data-tooltip={tooltip} data-tooltip-as="markdown" data-tooltip-clickable="false">
      <Styled.StatusBar>
        {sortedStatuses.map((status) => {
          const count = statusCounts[status.name] || 0
          return (
            <Styled.Status
              key={status.name}
              style={{ flex: count, backgroundColor: status.color, color:getTextColor(status.color) }}
            />
          )
        })}
      </Styled.StatusBar>
    </Styled.Cell>
  )
}
