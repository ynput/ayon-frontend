import { FC } from 'react'
import * as Styled from './FolderBody.styled'

interface FolderBodyProps {
  name: string
  isExpanded: boolean
  onExpandToggle: () => void
}

export const FolderBody: FC<FolderBodyProps> = ({ name, isExpanded, onExpandToggle }) => {
  return (
    <Styled.Body>
      <Styled.ExpandButton
        icon={isExpanded ? 'collapse_all' : 'expand_all'}
        variant="text"
        onClick={onExpandToggle}
      />
      <span className="title">{name}</span>
    </Styled.Body>
  )
}
