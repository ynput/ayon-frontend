import { FC } from 'react'
import styled from 'styled-components'

const Header = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: 100%;

  .type {
    height: 20px;
  }

  .names {
    display: flex;
    width: 100%;
  }

  .name {
    flex: 1;
  }
`

export type TaskTypeName = { name: string; label?: string | null }

interface TaskColumnHeaderProps {
  taskType: string
  taskNames: TaskTypeName[]
}

export const TaskColumnHeader: FC<TaskColumnHeaderProps> = ({ taskType, taskNames }) => {
  return (
    <Header>
      {<span className="type">{taskNames.length > 1 ? `${taskType}` : ''}</span>}
      <span className="names">
        {taskNames.map((task) => (
          <span key={task.name} className="name">
            {task.label || task.name}
          </span>
        ))}
      </span>
    </Header>
  )
}
