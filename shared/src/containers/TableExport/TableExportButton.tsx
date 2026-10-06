import { FC } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { useTableExportContext } from './TableExportContextInstance'

export const TableExportButton: FC = () => {
  const tableExport = useTableExportContext()
  return (
    <Button
      icon="download"
      label="Export"
      data-tooltip="Export the table or the selected rows to Excel or CSV"
      onClick={() => tableExport?.openExportDialog('table')}
    />
  )
}
