import { FC } from 'react'

interface TaskColumnHeaderProps {
  taskType: string
}

export const TaskColumnHeader: FC<TaskColumnHeaderProps> = ({ taskType }) => {
  return <span className="type">{taskType}</span>
}
