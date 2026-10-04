import { ExpandedState, RowPinningState, RowSelectionState, Table } from '@tanstack/react-table'
import { ReactNode } from 'react'
import { SimpleTableContext } from './SimpleTableContextInstance'

export interface SimpleTableContextValue {
  // forwarded from props
  expanded?: ExpandedState
  setExpanded?: React.Dispatch<React.SetStateAction<ExpandedState>>
  onExpandedChange?: (expanded: ExpandedState) => void
  rowSelection: RowSelectionState
  onRowSelectionChange: (selection: RowSelectionState) => void // should be used most of the time
  setRowSelection?: (rowSelection: RowSelectionState) => void // used to directly update the row selection
  rowPinning?: RowPinningState
  onRowPinningChange?: (rowPinning: RowPinningState) => void
  data?: any
}

interface SimpleTableProviderProps {
  children: ReactNode
  expanded?: SimpleTableContextValue['expanded']
  setExpanded?: SimpleTableContextValue['setExpanded']
  onExpandedChange?: SimpleTableContextValue['onExpandedChange']
  rowSelection: SimpleTableContextValue['rowSelection']
  onRowSelectionChange: SimpleTableContextValue['onRowSelectionChange']
  setRowSelection?: SimpleTableContextValue['setRowSelection']
  rowPinning?: SimpleTableContextValue['rowPinning']
  onRowPinningChange?: SimpleTableContextValue['onRowPinningChange']
  data?: SimpleTableContextValue['data']
}

export const SimpleTableProvider = ({ children, ...props }: SimpleTableProviderProps) => {
  return <SimpleTableContext.Provider value={{ ...props }}>{children}</SimpleTableContext.Provider>
}
