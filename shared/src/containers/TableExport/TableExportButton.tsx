import { FC, useId } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { useMenuContext } from '@shared/context'
import { Menu, MenuContainer } from '@shared/components/Menu'
import { useTableExportContext } from './TableExportContextInstance'

type TableExportButtonProps = {
  // with an import, one button opens a menu with both, to save toolbar space
  onImport?: () => void
}

export const TableExportButton: FC<TableExportButtonProps> = ({ onImport }) => {
  const tableExport = useTableExportContext()
  const { toggleMenuOpen, setMenuOpen } = useMenuContext()
  const menuId = useId()
  const openExport = () => tableExport?.openExportDialog('table')

  if (!onImport) {
    return (
      <Button
        icon="download"
        label="Export"
        data-tooltip="Export the table or the selected rows to Excel or CSV"
        onClick={openExport}
      />
    )
  }

  return (
    <>
      <Button
        id={menuId}
        icon="swap_vert"
        label="Import / Export"
        onClick={() => toggleMenuOpen(menuId)}
      />
      <MenuContainer targetId={menuId} id={menuId} align="right">
        <Menu
          menu={[
            { id: 'import', label: 'Import CSV...', icon: 'upload_file', onClick: onImport },
            { id: 'export', label: 'Export...', icon: 'download', onClick: openExport },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      </MenuContainer>
    </>
  )
}
