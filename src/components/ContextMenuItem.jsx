import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from '@ynput/ayon-react-components'

const ContextMenuItem = ({ icon, label, command, children, contextMenuRef, disabled }) => {
  const onCommand = (e) => {
    // hide the context menu
    contextMenuRef.current?.hide()

    command({
      originalEvent: e,
      item: {
        label: label,
        command: command,
      },
    })
  }

  return (
    <a
      className={`p-menuitem-link ${disabled ? 'p-disabled' : ''}`}
      role="menuitem"
      href="#"
      onClick={onCommand}
    >
      {icon && <Icon className="p-menuitem-icon" icon={icon} style={{ fontSize: '1.5rem' }} />}
      {label && <span className="p-menuitem-text">{label}</span>}
      {children}
    </a>
  )
}

ContextMenuItem.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.node,
  command: PropTypes.func,
  contextMenuRef: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
}

export default ContextMenuItem
