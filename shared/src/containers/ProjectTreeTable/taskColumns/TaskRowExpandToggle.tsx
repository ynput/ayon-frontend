import clsx from 'clsx'
import { useTaskColumnsContext } from './TaskColumnsContextInstance'
import * as Styled from './TaskColumnCell.styled'

/**
 * In a folder row's name cell while a task column is shown: makes the row tall, so its task cards
 * show their thumbnails. Not the chevron, which opens the folder's tasks as rows.
 */
export const TaskRowExpandToggle = ({ rowId }: { rowId: string }) => {
  const context = useTaskColumnsContext()
  if (!context?.isActive) return null
  const isExpanded = context.isRowExpanded(rowId)

  return (
    <Styled.RowToggle
      className={clsx('row-expand-toggle', { expanded: isExpanded })}
      icon={isExpanded ? 'unfold_less' : 'unfold_more'}
      data-tooltip={isExpanded ? 'Collapse row' : 'Expand row to thumbnails'}
      // the cell must not take the click as a selection, or the double click as a rename
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={() => context.toggleRowExpanded(rowId)}
    />
  )
}
