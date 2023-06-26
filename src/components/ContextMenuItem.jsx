import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from '@ynput/ayon-react-components'

const ContextMenuItem = ({
  icon,
  label,
  command,
  children,
  contextMenuRef,
  disabled,
  items,
  isSave,
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
      },
    })
  }

  const noItems = items && items.length === 0

  return (
    <a
      className={`p-menuitem-link ${disabled || noItems ? 'p-disabled' : ''}`}
      role="menuitem"
      href="#"
      onClick={onCommand}
      style={{
        paddingRight: 10,
        backgroundColor: isSave ? 'var(--color-hl-00)' : 'transparent',
        ...props?.style,
      }}
      {...props}
    >
      {icon && (
        <Icon
          className="p-menuitem-icon"
          icon={icon}
          style={{ fontSize: '1.5rem', color: isSave ? 'black' : 'white' }}
        />
      )}
      {label && (
        <span
          className="p-menuitem-text"
          style={{
            whiteSpace: 'nowrap',
            color: isSave ? 'black' : 'white',
          }}
        >
          {label}
        </span>
      )}
      {children}

      <Icon
        icon="chevron_right"
        style={{
          marginLeft: 'auto',
          fontSize: '1.5rem',
          opacity: items ? 1 : 0,
          color: isSave ? 'black' : 'white',
        }}
      />
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
  items: PropTypes.array,
  isSave: PropTypes.bool,
}

export default ContextMenuItem
