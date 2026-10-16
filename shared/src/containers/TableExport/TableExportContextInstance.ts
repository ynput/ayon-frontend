import { createContext, useContext } from 'react'
import type { TableExportScope } from './tableExportSettings'

export type TableExportContextType = {
  scope: TableExportScope | null // the open dialog's scope, null when closed
  openExportDialog: (scope: TableExportScope) => void
  closeExportDialog: () => void
}

export const TableExportContext = createContext<TableExportContextType | undefined>(undefined)

// undefined outside a TableExportProvider: the page has no export dialog
export const useTableExportContext = () => useContext(TableExportContext)
