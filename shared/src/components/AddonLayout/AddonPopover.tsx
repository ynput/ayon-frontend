// The host's popover around a contribution's `popover` piece (header and toolbar items): the
// header menus' container (MenuContainer: positioned under the button, closed by a click on its
// backdrop or Escape) with the piece inside, on a menu's surface.
import { useEffect, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import styled from 'styled-components'
import { ContributionView } from '@ynput/ayon-addon'
import type { AnyContribution, Contribution, SlotMap, SlotName } from '@ynput/ayon-addon'
import { MenuContainer } from '@shared/components/Menu/MenuContainer'
import { ReportCrash } from './AddonDialog'

const Surface = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  border-radius: 8px;
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  outline: none;
`

interface PopoverBoxProps {
  anchor: HTMLElement | null
  close: () => void
  children: ReactNode
}

const PopoverBox = ({ anchor, close, children }: PopoverBoxProps) => {
  const ref = useRef<HTMLDivElement>(null)

  // the backdrop starts below the app header: a click in the header closes the popover too, as
  // opening another header menu would
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const backdrop = ref.current?.closest('dialog')
      const target = event.target as Element
      if (!backdrop || backdrop.contains(target) || anchor?.contains(target)) return
      if (target.closest?.('dialog')) return
      if (event.clientY < backdrop.getBoundingClientRect().top) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [anchor, close])

  // MenuContainer focuses the first item once it is positioned. Without one (text, an input, or
  // still loading), focus would stay on the button and Escape would never reach this surface. A
  // hidden menu can't take focus, so wait a frame for the position.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const surface = ref.current
      if (surface && !surface.contains(document.activeElement)) surface.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // Escape in a menu or dialog opened from the popover is theirs: portalled elsewhere, it still
  // bubbles here through the React tree and would close the popover as well
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    if (event.defaultPrevented || !ref.current?.contains(event.target as Node))
      event.stopPropagation()
  }

  return (
    <Surface ref={ref} tabIndex={-1} className="addon-popover" onKeyDown={onKeyDown}>
      {children}
    </Surface>
  )
}

export interface AddonPopoverProps<S extends SlotName> {
  contribution: Contribution<S>
  /** the slot's context with `close`; memoize it */
  context: SlotMap[S]['context'] & { close: () => void }
  open: boolean
  /** the button it hangs from */
  anchor: HTMLElement | null
}

export const AddonPopover = <S extends SlotName>({
  contribution,
  context,
  open,
  anchor,
}: AddonPopoverProps<S>) => {
  const any = contribution as unknown as AnyContribution
  return (
    <MenuContainer
      id={`addon-popover:${any.slot}:${any.key}`}
      target={anchor}
      isOpen={open}
      onDismiss={context.close}
    >
      <PopoverBox anchor={anchor} close={context.close}>
        <ContributionView
          contribution={contribution}
          piece="popover"
          context={context}
          error={(error) => (
            <ReportCrash contribution={any} error={error} onReported={context.close} />
          )}
        />
      </PopoverBox>
    </MenuContainer>
  )
}
