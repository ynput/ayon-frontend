import { FC } from 'react'
import * as Styled from './ParentBody.styled'
import clsx from 'clsx'
import { pluralize } from '@shared/util'

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
      <Styled.ExpandButton
        icon={'expand_more'}
        variant="text"
        onClick={onCollapseToggle}
        className={clsx({ collapsed: isCollapsed })}
      />
      <span className="title">{name}</span>
      {!!folderCount && <span className="count">· {pluralize(folderCount, 'folder')}</span>}
      {!!taskCount && <span className="count">· {pluralize(taskCount, 'task')}</span>}
    </Styled.ParentBody>
  )
}

export default ParentBody
