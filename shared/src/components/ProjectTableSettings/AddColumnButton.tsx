import { FC } from 'react'
import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import { useMenuContext, useSettingsPanel } from '@shared/context'
import { useAddColumnsMenu } from './useAddColumnsMenu'
import { useProjectTableColumnItems } from './useProjectTableColumnItems'
import { AddColumnMenu } from './AddColumnMenu'
import type { MenuItemType } from '../Menu'

const ADD_COLUMN_MENU_TABLE_ID = 'add-column-menu-table'

const ButtonPosition = styled.div`
  position: absolute;
  top: 4px;
  right: 24px;
  z-index: 100;

  button.hasIcon {
    padding: 2px;
    border-radius: 12px;
  }
`

interface AddColumnButtonProps {
  extraColumns?: { value: string; label: string }[]
  hiddenColumns?: string[]
  includeLinks?: boolean
  extraMenuItems?: MenuItemType[]
}

export const AddColumnButton: FC<AddColumnButtonProps> = ({
  extraColumns,
  hiddenColumns,
  includeLinks,
  extraMenuItems,
}) => {
  const { isPanelOpen } = useSettingsPanel()
  const { toggleMenuOpen } = useMenuContext()
  const { visibleColumns, scopes } = useProjectTableColumnItems({
    extraColumns,
    hiddenColumns,
    includeLinks,
  })
  const { menuItems, hasMenuItems, dragOverlay } = useAddColumnsMenu({
    columns: visibleColumns,
    scopes,
    extraItems: extraMenuItems,
  })

  if (isPanelOpen) return null

  return (
    <ButtonPosition>
      <Button
        icon="add"
        variant="tonal"
        id={ADD_COLUMN_MENU_TABLE_ID}
        data-tooltip="Add column"
        disabled={!hasMenuItems}
        onClick={() => toggleMenuOpen(ADD_COLUMN_MENU_TABLE_ID)}
      />
      <AddColumnMenu menuId={ADD_COLUMN_MENU_TABLE_ID} menuItems={menuItems} />
      {dragOverlay}
    </ButtonPosition>
  )
}
