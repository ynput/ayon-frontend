import React, { RefObject } from 'react'
import { Icon, ShortcutTag } from '@ynput/ayon-react-components'
import './ContextMenu.scss'

interface CommandEvent {
  originalEvent: React.MouseEvent
  item: {
    label: string
    command: (event: CommandEvent) => void
    shortcut?: string
  }
}

export interface ContextMenuItemProps {
  icon?: string
  label?: string
  shortcut?: string
  command?: (event: CommandEvent) => void
  children?: React.ReactNode
  contextMenuRef: RefObject<{ hide: () => void }>
  disabled?: boolean
  items?: any[]
  isSave?: boolean
  danger?: boolean
  style?: React.CSSProperties
  [key: string]: any // For any additional props
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({
  icon,
  label,
  shortcut,
  command,
  children,
  contextMenuRef,
  disabled,
  items,
  isSave,
  danger,
  ...props
}) => {
  const onCommand = (e: React.MouseEvent) => {
    // hide the context menu
    contextMenuRef.current?.hide()

    command?.({
      originalEvent: e,
      item: {
        label: label || '',
        command: command || (() => {}),
        shortcut,
      },
    })
  }

  const noItems = items && items.length === 0

  return (
    <a
      className={`p-menuitem-link ${disabled || noItems ? 'p-disabled' : ''} ${
        danger ? 'danger' : ''
      } ${isSave ? 'save' : ''}`}
      role="menuitem"
      href="#"
      onClick={onCommand}
      style={{
        ...props?.style,
      }}
      {...props}
    >
      {icon && <Icon className="p-menuitem-icon" icon={icon} />}
      {label && (
        <span
          className="p-menuitem-text"
          style={{
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
      {children}
      {shortcut && (
        <div className="p-menuitem-shortcut">
          <ShortcutTag>{shortcut}</ShortcutTag>
        </div>
      )}
      {!!items?.length && (
        <Icon
          icon="chevron_right"
          style={{
            marginLeft: 'auto',
            fontSize: '1.5rem',
          }}
        />
      )}
    </a>
  )
}

export default ContextMenuItem
