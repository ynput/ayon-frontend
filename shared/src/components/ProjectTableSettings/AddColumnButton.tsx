import { FC, useLayoutEffect, useState } from 'react'
import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import { useMenuContext, useSettingsPanel } from '@shared/context'
import { useAddColumnsMenu } from './useAddColumnsMenu'
import { useProjectTableColumnItems } from './useProjectTableColumnItems'
import { AddColumnMenu } from './AddColumnMenu'
import type { MenuItemType } from '../Menu'

const ADD_COLUMN_MENU_TABLE_ID = 'add-column-menu-table'
const BUTTON_GAP = 4

const ButtonPosition = styled.div`
  position: absolute;
  top: 4px;
  z-index: 100;

  button.hasIcon {
    padding: 2px;
    border-radius: 12px;
  }
`

// offset that straddles the last column's edge, null when the button doesn't fit there
const useLastColumnOffset = (button: HTMLDivElement | null) => {
  const [offset, setOffset] = useState<number | null>(null)

  useLayoutEffect(() => {
    const wrapper = button?.parentElement
    const table = wrapper?.querySelector('.table-container table')
    if (!button || !wrapper || !table) return

    const measure = () => {
      // not the table's own width: the selection column reserves more than it paints
      const lastHeaderCell = table.querySelector('thead tr')?.lastElementChild
      if (!lastHeaderCell) return

      const wrapperRect = wrapper.getBoundingClientRect()
      const columnsEnd = lastHeaderCell.getBoundingClientRect().right - wrapperRect.left
      const half = button.offsetWidth / 2
      const fits = columnsEnd + half + BUTTON_GAP <= wrapperRect.width
      setOffset(fits ? columnsEnd - half : null)
    }

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(wrapper)
    resizeObserver.observe(table)
    measure()

    return () => resizeObserver.disconnect()
  }, [button])

  return offset
}

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
  const { menuItems, hasColumnsToAdd } = useAddColumnsMenu({
    columns: visibleColumns,
    scopes,
    extraItems: extraMenuItems,
  })
  // state, not a ref: the button unmounts with the settings panel and has to be measured again
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const offset = useLastColumnOffset(container)

  if (isPanelOpen) return null

  return (
    <ButtonPosition
      ref={setContainer}
      style={offset === null ? { right: BUTTON_GAP } : { left: offset }}
    >
      <Button
        icon="add"
        id={ADD_COLUMN_MENU_TABLE_ID}
        data-tooltip="Add column"
        disabled={!hasColumnsToAdd}
        onClick={() => toggleMenuOpen(ADD_COLUMN_MENU_TABLE_ID)}
      />
      <AddColumnMenu menuId={ADD_COLUMN_MENU_TABLE_ID} menuItems={menuItems} />
    </ButtonPosition>
  )
}
