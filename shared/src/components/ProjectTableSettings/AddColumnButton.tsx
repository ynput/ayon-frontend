import { FC, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { css } from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import { useMenuContext, useSettingsPanel } from '@shared/context'
import { ADD_COLUMN_SLOT_ATTRIBUTE } from '@shared/containers/ProjectTreeTable/constants'
import { useAddColumnsMenu } from './useAddColumnsMenu'
import { useProjectTableColumnItems } from './useProjectTableColumnItems'
import { AddColumnMenu } from './AddColumnMenu'
import type { MenuItemType } from '../Menu'
import type { AddColumnItem } from './addColumnsMenu'
import type { ParentColumnDefinition } from '@shared/containers'

const ADD_COLUMN_MENU_TABLE_ID = 'add-column-menu-table'

const buttonStyles = css`
  button.hasIcon {
    padding: 2px;
    border-radius: 12px;
  }
`

const ButtonInHeader = styled.div`
  display: flex;
  ${buttonStyles}
`

// only until the table's header slot is found
const ButtonPosition = styled.div`
  position: absolute;
  top: 4px;
  right: 24px;
  z-index: 100;
  ${buttonStyles}
`

// The table next to this button keeps a cell at the end of its header row for it. It is
// looked up in the DOM because pages render the button beside the table, not inside it.
const useAddColumnSlot = (anchor: HTMLElement | null) => {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const parent = anchor?.parentElement
    if (!parent) return setSlot(null)

    const findSlot = () =>
      setSlot(parent.querySelector<HTMLElement>(`[${ADD_COLUMN_SLOT_ATTRIBUTE}]`))
    findSlot()
    // the table can mount, or mount again, after the button
    const observer = new MutationObserver(findSlot)
    observer.observe(parent, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [anchor])

  return slot
}

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
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null)
  const slot = useAddColumnSlot(anchor)

  if (isPanelOpen) return null

  const button = (
    <Button
      icon="add"
      variant="tonal"
      id={ADD_COLUMN_MENU_TABLE_ID}
      data-tooltip="Add column"
      disabled={!hasMenuItems}
      onClick={() => toggleMenuOpen(ADD_COLUMN_MENU_TABLE_ID)}
    />
  )

  return (
    <>
      <span ref={setAnchor} hidden />
      {slot ? (
        createPortal(<ButtonInHeader>{button}</ButtonInHeader>, slot)
      ) : (
        <ButtonPosition>{button}</ButtonPosition>
      )}
      <AddColumnMenu menuId={ADD_COLUMN_MENU_TABLE_ID} menuItems={menuItems} />
      {dragOverlay}
    </>
  )
}
