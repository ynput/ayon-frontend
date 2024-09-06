import { FC } from 'react'
import * as Styled from './ParentBody.styled'
import { ExpandButton } from '../FolderBody/FolderBody.styled'

interface ParentBodyProps {
  name: string
  folderCount?: number
  taskCount?: number
  isCollapsed?: boolean
  onCollapseToggle?: () => void
}

const ParentBody: FC<ParentBodyProps> = ({
  name,
  folderCount,
  taskCount,
  isCollapsed,
  onCollapseToggle,
}) => {
  return (
    <Styled.ParentBody>
      <ExpandButton
        icon={isCollapsed ? 'expand_less' : 'expand_more'}
        variant="text"
        onClick={onCollapseToggle}
      />
      <span className="title">{name}</span>
      {folderCount && <span className="count"> - {folderCount} folders</span>}
      {taskCount && <span className="count"> - {taskCount} tasks</span>}
    </Styled.ParentBody>
  )
}

export default ParentBody
