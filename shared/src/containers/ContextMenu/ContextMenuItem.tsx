import React, { RefObject } from 'react'
import { Icon, ShortcutTag } from '@ynput/ayon-react-components'
import './ContextMenu.scss'
import clsx from 'clsx'
import { PowerpackFeature } from '@shared/context'

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
  powerFeature?: PowerpackFeature
  powerLicense?: boolean // This should be passed from the context or props
  onPowerClick?: (feature: PowerpackFeature) => void // Function to handle power feature click
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
  powerFeature, // if the feature requires a Powerpack license
  powerLicense, // if the user has a Powerpack license
  onPowerClick, // callback to handle when they do not have a license and click the power feature
  ...props
}) => {
  if (hidden) return null

  const onCommand = (e: React.MouseEvent) => {
    // hide the context menu
    contextMenuRef.current?.hide()
    e.preventDefault()

    if (powerFeature && !powerLicense && onPowerClick) {
      // we don't want to execute the command if the feature is not available
      onPowerClick(powerFeature)
      return
    }

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
  const showPowerFeatureIcon = powerFeature && !powerLicense

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
      {showPowerFeatureIcon && (
        <Icon
          icon="bolt"
          style={{
            marginLeft: 'auto',
            paddingLeft: '1rem',
            fontSize: '1.5rem',
          }}
        />
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
