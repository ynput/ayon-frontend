// PROTOTYPE (navigation mix): a sidebar group's header, which expands the group in place
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './NavRail.styled'

export const GroupHeader = ({
  icon,
  label,
  hint,
  expanded,
  current,
  onClick,
  onToggle,
  onContextMenu,
  onMouseDown,
  projectAnchor,
  className,
  dot,
  menuAnchor,
  iconNode,
}: {
  icon: string
  label: string
  hint?: string
  expanded: boolean
  current: boolean
  /** expands or collapses the group (or, without items, does what the group does) */
  onClick: () => void
  /** shows the chevron */
  onToggle?: () => void
  /** right-click */
  onContextMenu?: () => void
  onMouseDown?: () => void
  /** the project switcher opens beside it */
  projectAnchor?: boolean
  /** a notification dot, like the header's inbox icon */
  dot?: boolean
  /** shown instead of the icon, e.g. the user's picture */
  iconNode?: React.ReactNode
  /** a span the group's own menu opens beside */
  menuAnchor?: React.Ref<HTMLSpanElement>
  className?: string
}) => (
  <Styled.MoreItem
    type="button"
    className={clsx(className, { active: current })}
    aria-expanded={expanded}
    data-tooltip={hint || label}
    data-tooltip-position="right"
    onClick={onClick}
    onMouseDown={onMouseDown}
    onContextMenu={
      onContextMenu
        ? (e) => {
            e.preventDefault()
            onContextMenu()
          }
        : undefined
    }
    data-project-menu-anchor={projectAnchor ? '' : undefined}
    style={{ position: 'relative' }}
  >
    {iconNode ?? <Icon icon={icon} />}
    <Styled.Label>{label}</Styled.Label>
    {dot && <Styled.NotificationDot />}
    {menuAnchor && <Styled.DockAnchor ref={menuAnchor} />}
    {onToggle && (
      <Icon
        icon={expanded ? 'expand_less' : 'expand_more'}
        style={{ fontSize: 16, marginTop: -4, opacity: 0.7 }}
      />
    )}
  </Styled.MoreItem>
)

