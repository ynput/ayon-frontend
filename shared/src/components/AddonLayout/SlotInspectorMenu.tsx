// Developer mode's slot inspector in the header: Show slots, Highlight contributions and the
// addons' colours. AYON's header shows it while developer mode is on; the addon dev shell's top bar
// shows the same menu. Internal, like slotInspector.
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useMenuContext } from '@shared/context'
import { MenuContainer } from '../Menu/MenuContainer'
import * as MenuStyled from '../Menu/Menu.styled'
import { HeaderButton } from '../HeaderButton'
import { SlotInspectorControls } from './SlotInspectorControls'
import { setSlotInspectorAvailable, useSlotInspector } from './slotInspector'

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
