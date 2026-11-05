import { FC } from 'react'
import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import { useMenuContext, useSettingsPanel } from '@shared/context'
import { useAddColumnsMenu } from './useAddColumnsMenu'
import { useProjectTableColumnItems } from './useProjectTableColumnItems'
import { AddColumnMenu } from './AddColumnMenu'
import type { MenuItemType } from '../Menu'
import type { AddColumnItem } from './addColumnsMenu'
import type { ParentColumnDefinition } from '@shared/containers'

const ADD_COLUMN_MENU_TABLE_ID = 'add-column-menu-table'

// Covers the end of the header row so the button never sits on top of header text.
// ProjectTreeTable reserves the same width after the last column (ADD_COLUMN_BUTTON_SPACE).
const ButtonPosition = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: var(--size-header);
  padding: 0 24px 0 8px;
  background-color: var(--color-table-header);
  border-top-right-radius: var(--border-radius-m);

  button.hasIcon {
    padding: 2px;
    border-radius: 12px;
  }
`

interface AddColumnButtonProps {
  extraColumns?: Pick<AddColumnItem, 'value' | 'label' | 'icon' | 'menu'>[]
  hiddenColumns?: string[]
  includeLinks?: boolean
  extraMenuItems?: MenuItemType[]
  parentColumns?: ParentColumnDefinition[]
}

export const AddColumnButton: FC<AddColumnButtonProps> = ({
  extraColumns,
  hiddenColumns,
  includeLinks,
  extraMenuItems,
  parentColumns,
}) => {
  const { isPanelOpen } = useSettingsPanel()
  const { toggleMenuOpen } = useMenuContext()
  const { visibleColumns, scopes } = useProjectTableColumnItems({
    extraColumns,
    hiddenColumns,
    includeLinks,
    parentColumns,
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
