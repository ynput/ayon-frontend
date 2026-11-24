import { FC, ReactNode } from 'react'
import {
  SimpleTableCellTemplate,
  SimpleTableCellTemplateProps,
  SimpleTableRow,
} from '@shared/containers/SimpleTable'

export interface ListsTableCellProps extends SimpleTableCellTemplateProps {
  row: SimpleTableRow // a list or folder row from buildListsTableData
  hideCount?: boolean // a folders-only table fetches no lists, so every count would read 0
  tag?: ReactNode // shown left of the count
}

// A row of the lists table (Lists page, list pickers): the icon in its colour, and as its badge
// why it can't be picked, else "(archived)", else the count.
export const ListsTableCell: FC<ListsTableCellProps> = ({ row, hideCount, tag, ...props }) => {
  const { isDisabled, disabledMessage, inactive, data } = row
  const badge = isDisabled
    ? disabledMessage
    : inactive
    ? '(archived)'
    : hideCount
    ? undefined
    : data.count

  return (
    <SimpleTableCellTemplate
      {...props}
      iconColor={data.color}
      enableNonFolderIndent={false}
      badge={
        tag ? (
          <>
            {tag}
            {badge !== undefined && <span>{badge}</span>}
          </>
        ) : (
          badge
        )
      }
    />
  )
}
