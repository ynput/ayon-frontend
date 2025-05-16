import React, { RefObject } from 'react'
import { Icon, ShortcutTag } from '@ynput/ayon-react-components'
import './ContextMenu.scss'
import clsx from 'clsx'

export interface CommandEvent {
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
  hidden?: boolean
  items?: any[]
  isSave?: boolean
  danger?: boolean
  developer?: boolean
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
  hidden,
  items,
  isSave,
  danger,
  developer,
  ...props
}) => {
  if (hidden) return null

  const onCommand = (e: React.MouseEvent) => {
    // hide the context menu
    contextMenuRef.current?.hide()
    e.preventDefault()

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
      className={clsx('p-menuitem-link', {
        'p-disabled': disabled || noItems,
        danger,
        developer,
        save: isSave,
      })}
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
