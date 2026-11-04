import { FC, useId } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { useMenuContext, usePowerpack, useTableExportContext } from '@shared/context'
import { Menu, MenuContainer } from '@shared/components/Menu'

type TableExportButtonProps = {
  // with an import, one button opens a menu with both, to save toolbar space
  onImport?: () => void
}

export const TableExportButton: FC<TableExportButtonProps> = ({ onImport }) => {
  const tableExport = useTableExportContext()
  const { isLoading: isCheckingLicense } = usePowerpack()
  const { toggleMenuOpen, setMenuOpen } = useMenuContext()
  const menuId = useId()
  const openExport = () => tableExport?.openExport('table')

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
        data-testid="table-import-export"
        icon="swap_vert"
        label="Import / Export"
        onClick={() => toggleMenuOpen(menuId)}
      />
      <MenuContainer targetId={menuId} id={menuId} align="right">
        <Menu
          menu={[
            {
              id: 'import',
              label: 'Import',
              icon: 'upload_file',
              onClick: onImport,
              'data-testid': 'import-file',
            },
            {
              id: 'export',
              label: 'Export',
              icon: 'download',
              // while the license is checked, openExport waits for it instead of the menu
              // showing the Power Pack dialog
              powerFeature: isCheckingLicense ? undefined : 'tableExport',
              onClick: openExport,
            },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      </MenuContainer>
    </>
  )
}
