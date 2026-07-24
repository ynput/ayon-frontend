import { Row, RowData, Table } from '@tanstack/react-table'
import { ContextMenuItemType } from '../ContextMenu'
import { SimpleTableCellTemplateProps } from './SimpleTableRowTemplate'
import { RankingInfo } from '@tanstack/match-sorter-utils'

declare module '@tanstack/react-table' {
  //add fuzzy filter to the filterFns
  interface FilterFns {
    fuzzy: (
      row: Row<any>,
      columnId: string,
      searchValue: string,
      addMeta: (meta: any) => void,
    ) => boolean
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }

  interface TableMeta<TData extends RowData> {
    isExpandable?: boolean
    isLoading?: boolean
    children?: (
      props: SimpleTableCellTemplateProps,
      row: Row<TData>,
      table: Table<SimpleTableRow>,
    ) => JSX.Element
    [key: string]: any
  }
}

export type RowItemData = {
  id: string
  name?: string | null
  label?: string | null
  subType?: string | null
  [key: string]: any
}

export type SimpleTableRow = {
  id: string
  parentId?: string
  name: string
  label: string
  parents?: string[]
  icon?: string | null
  iconColor?: string
  iconFilled?: boolean
  img?: string | null
  imgShape?: 'square' | 'circle'
  startContent?: JSX.Element
  endContent?: JSX.Element
  subRows: SimpleTableRow[]
  data: RowItemData
  isDisabled?: boolean
  disabledMessage?: string
  inactive?: boolean
}

export type SimpleTableRowContextMenuContext = {
  rowId: string
  rowIndex: number
  row: Row<SimpleTableRow>
  selectedRows: string[]
  isSelected: boolean
}

export type SimpleTableRowContextMenuBuilder = (
  e: React.MouseEvent<HTMLTableRowElement>,
  context: SimpleTableRowContextMenuContext,
) => ContextMenuItemType | ContextMenuItemType[] | undefined

export interface SimpleTableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  data: SimpleTableRow[]
  isLoading: boolean
  error?: string
  isExpandable?: boolean // show expand/collapse icons
  isMultiSelect?: boolean // enable multi-select with shift+click and ctrl/cmd+click
  enableClickToDeselect?: boolean // allow deselecting a single selected row by clicking it again & clicking outside clears selection
  enableNonFolderIndent?: boolean // indent non-folder rows to align with folder rows
  forceUpdateTable?: any
  globalFilter?: string
  meta?: Record<string, any>
  rowHeight?: number // height of each row, used for virtual scrolling
  imgRatio?: number
  onScrollBottom?: () => void // callback fired when scrolled to the bottom of the table
  onRename?: (id: string, row: Row<SimpleTableRow>) => void
  renamingId?: string | null
  renameInitialValue?: string
  onSubmitRename?: (id: string, value: string) => void
  onCancelRename?: () => void
  onRowDoubleClick?: (id: string, row: Row<SimpleTableRow>) => void
  onRowOptionClick?: (row: SimpleTableRow, selectedRows: string[]) => void
  fitContent?: boolean
  rowContextMenuBuilders?: SimpleTableRowContextMenuBuilder[]
  children?: (
    props: SimpleTableCellTemplateProps,
    row: Row<SimpleTableRow>,
    table: Table<SimpleTableRow>,
  ) => JSX.Element
  pt?: {
    cell?: Partial<SimpleTableCellTemplateProps>
    row?: Partial<React.HTMLAttributes<HTMLTableRowElement>>
  }
}
