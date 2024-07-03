import React from 'react'
import PropTypes from 'prop-types'
import { Icon, ShortcutTag } from '@ynput/ayon-react-components'
import './ContextMenu.scss'

const ContextMenuItem = ({
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
  const onCommand = (e) => {
    // hide the context menu
    contextMenuRef.current?.hide()

    command({
      originalEvent: e,
      item: {
        label: label,
        command: command,
        shortcut: shortcut,
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

ContextMenuItem.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  shortcut: PropTypes.string,
  children: PropTypes.node,
  command: PropTypes.func,
  contextMenuRef: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  items: PropTypes.array,
  isSave: PropTypes.bool,
}

export default ContextMenuItem
