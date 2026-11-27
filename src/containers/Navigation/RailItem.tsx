import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import type { NavItem } from './types'
import * as Styled from './NavRail.styled'

interface RailItemProps {
  item: NavItem
  /** where it opens: its landing page (a disabled item opens nothing) */
  to?: string
  isActive: boolean
  /** the smaller items of the admin area */
  compact?: boolean
  /**
   * While the layout is edited: whether it hides the item (the eye), whether the item is gone from
   * the sidebar (dimmed: hidden, or all its tabs are), and hiding or showing it. `labels` say what
   * the eye does when that isn't Show and Hide (an admin page moves to or from the Admin menu).
   */
  edit?: {
    hidden: boolean
    dimmed: boolean
    toggle: () => void
    labels?: { show: string; hide: string }
  }
  [data: `data-${string}`]: string | boolean | undefined
}

/**
 * A sidebar item. A plain click on the open item does nothing (a page may have changed the URL
 * without the router); a modified one still opens a new browser tab. A disabled item is faded and
 * its tooltip says why; without a page (`to`) it is no link, only focusable.
 */
const RailItem = ({ item, to, isActive, compact, edit, ...data }: RailItemProps) => {
  const content = (
    <>
      <Icon icon={item.icon} />
      <Styled.Label>{item.label}</Styled.Label>
      {edit && (
        <Styled.ItemEye
          icon={edit.hidden ? 'visibility_off' : 'visibility'}
          role="button"
          aria-label={
            edit.labels
              ? `${item.label}: ${edit.hidden ? edit.labels.show : edit.labels.hide}`
              : edit.hidden
              ? `Show ${item.label}`
              : `Hide ${item.label}`
          }
          data-tooltip={
            edit.hidden ? edit.labels?.show ?? 'Show' : edit.labels?.hide ?? 'Hide'
          }
          onClick={(e) => {
            // the eye sits inside the item's link
            e.preventDefault()
            e.stopPropagation()
            edit.toggle()
          }}
        />
      )}
    </>
  )
  const className = clsx({
    active: isActive,
    compact,
    'layout-hidden': edit?.dimmed,
    unavailable: !!item.disabled,
  })

  if (!to)
    return (
      <Styled.DisabledItem
        className={className}
        role="link"
        aria-disabled
        tabIndex={0}
        aria-label={item.label}
        data-rail-item={item.id}
        data-tooltip={item.disabled ?? item.label}
        data-tooltip-position="right"
        {...item.tags}
        {...data}
      >
        {content}
      </Styled.DisabledItem>
    )

  return (
    <Styled.Item
      to={to}
      className={className}
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
      data-tooltip={item.disabled ?? item.label}
      data-tooltip-position="right"
      {...item.tags}
      {...data}
    >
      {content}
    </Styled.Item>
  )
}

export default RailItem
