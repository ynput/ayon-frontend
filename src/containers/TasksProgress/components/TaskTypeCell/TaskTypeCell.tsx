import { FC, ReactNode } from 'react'
import * as Styled from './TaskTypeCell.styled'

interface TaskTypeCellProps {
  children: ReactNode
}

export const TaskTypeCell: FC<TaskTypeCellProps> = ({ children }) => {
  return <Styled.Cell>{children}</Styled.Cell>
}
