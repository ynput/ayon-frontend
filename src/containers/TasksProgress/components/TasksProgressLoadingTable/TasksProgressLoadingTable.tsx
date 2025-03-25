import { FC } from 'react'
import * as Styled from './TasksProgressLoadingTable.styled'

interface TasksProgressLoadingTableProps {
  rows: number
}

export const TasksProgressLoadingTable: FC<TasksProgressLoadingTableProps> = ({ rows = 1 }) => {
  const items = Array.from({ length: rows }, (_, i) => i)

  return (
    <Styled.LoadingTable>
      <Styled.LoadingHeader />
      {items.map((item) => (
        <Styled.LoadingRow key={item}>
          <span className="loading folder"></span>
          <span className="loading completed"></span>
          <span className="loading task"></span>
          <span className="loading task"></span>
          <span className="loading task"></span>
          <span className="loading task"></span>
          <span className="loading task"></span>
        </Styled.LoadingRow>
      ))}
    </Styled.LoadingTable>
  )
}
