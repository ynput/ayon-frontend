// Developer mode's slot inspector in the header: Show slots, Highlight contributions and the
// addons' colours (SlotInspectorControls, shared with the addon dev shell).
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useMenuContext } from '@shared/context'
import {
  MenuContainer,
  SlotInspectorControls,
  setSlotInspectorAvailable,
  useSlotInspector,
} from '@shared/components'
import * as MenuStyled from '@shared/components/Menu/Menu.styled'
import HeaderButton from '../HeaderButton'

const MENU_ID = 'slot-inspector'

export const SlotInspectorMenu = () => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { menuOpen, toggleMenuOpen } = useMenuContext()
  const { showSlots, highlight } = useSlotInspector()

  // the switches apply while this menu is in the header: developer mode is on
  useEffect(() => {
    setSlotInspectorAvailable(true)
    return () => setSlotInspectorAvailable(false)
  }, [])

  return (
    <>
      <HeaderButton
        ref={buttonRef}
        icon="extension"
        variant="nav"
        data-tooltip="Addon slots"
        aria-label="Addon slots"
        className={clsx({ active: menuOpen === MENU_ID || showSlots || highlight })}
        onClick={() => toggleMenuOpen(MENU_ID)}
      />
      <MenuContainer id={MENU_ID} target={buttonRef.current}>
        {/* the surface of AYON's other header menus */}
        <MenuStyled.Section>
          <SlotInspectorControls />
        </MenuStyled.Section>
      </MenuContainer>
    </>
  )
}
