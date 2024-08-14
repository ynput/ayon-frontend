import { FC, ReactNode } from 'react'
import * as Styled from './TaskTypeCell.styled'
import clsx from 'clsx'

interface TaskTypeCellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  isSelected?: boolean
}

export const TaskTypeCell: FC<TaskTypeCellProps> = ({ children, isSelected, ...props }) => {
  return (
    <Styled.Cell className={clsx({ selected: isSelected })} {...props}>
      {children}
    </Styled.Cell>
  )
}
