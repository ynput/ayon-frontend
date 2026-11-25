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
  [data: `data-${string}`]: string | boolean | undefined
}

/**
 * A sidebar item. A plain click on the open item does nothing (a page may have changed the URL
 * without the router); a modified one still opens a new browser tab.
 */
const RailItem = ({ item, to, isActive, compact, ...data }: RailItemProps) => (
  <Styled.Item
    to={to}
    className={clsx({ active: isActive, compact })}
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
  </Styled.Item>
)

export default RailItem
