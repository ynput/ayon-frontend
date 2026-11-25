import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import type { NavItem } from './types'
import * as Styled from './NavRail.styled'

interface RailItemProps {
  item: NavItem
  /** where it opens: its landing page */
  to: string
  isActive: boolean
  /** the smaller items of the admin area */
  compact?: boolean
  /** while the layout is edited: whether it hides the item, and the eye that hides or shows it */
  edit?: { hidden: boolean; toggle: () => void }
  [data: `data-${string}`]: string | boolean | undefined
}

/**
 * A sidebar item. A plain click on the open item does nothing (a page may have changed the URL
 * without the router); a modified one still opens a new browser tab.
 */
const RailItem = ({ item, to, isActive, compact, edit, ...data }: RailItemProps) => (
  <Styled.Item
    to={to}
    className={clsx({ active: isActive, compact, 'layout-hidden': edit?.hidden })}
    // while editing, the item drags to a new place instead of the browser dragging its link
    draggable={edit ? false : undefined}
    aria-current={isActive ? 'page' : undefined}
    onClick={
      isActive
        ? (e) => {
            if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey)
              e.preventDefault()
          }
        : undefined
    }
    aria-label={item.label}
    data-rail-item={item.id}
    data-tooltip={item.label}
    data-tooltip-position="right"
    {...item.tags}
    {...data}
  >
    <Icon icon={item.icon} />
    <Styled.Label>{item.label}</Styled.Label>
    {edit && (
      <Styled.ItemEye
        icon={edit.hidden ? 'visibility_off' : 'visibility'}
        role="button"
        aria-label={edit.hidden ? `Show ${item.label}` : `Hide ${item.label}`}
        data-tooltip={edit.hidden ? 'Show' : 'Hide'}
        onClick={(e) => {
          // the eye sits inside the item's link
          e.preventDefault()
          e.stopPropagation()
          edit.toggle()
        }}
      />
    )}
  </Styled.Item>
)

export default RailItem
