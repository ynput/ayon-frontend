import { FC } from 'react'
import * as Styled from './ParentBody.styled'

interface ParentBodyProps {
  name: string
  folderCount?: number
  taskCount?: number
}

const ParentBody: FC<ParentBodyProps> = ({ name, folderCount, taskCount }) => {
  return (
    <Styled.ParentBody>
      <span className="title">{name}</span>
      {folderCount && <span className="count"> - {folderCount} folders</span>}
      {taskCount && <span className="count"> - {taskCount} tasks</span>}
    </Styled.ParentBody>
  )
}

export default ParentBody
