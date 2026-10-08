import { FC, ReactNode, useMemo, useState } from 'react'
import { TableExportContext } from './TableExportContextInstance'
import type { TableExportScope } from './tableExportSettings'

// Holds the export dialog's state, so the context menu and the toolbar can open it.
// The page renders the dialog with TableExportDialogHost.
export const TableExportProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [scope, setScope] = useState<TableExportScope | null>(null)
  const value = useMemo(
    () => ({
      scope,
      openExportDialog: setScope,
      closeExportDialog: () => setScope(null),
    }),
    [scope],
  )
  return <TableExportContext.Provider value={value}>{children}</TableExportContext.Provider>
}
