import React from 'react'
import PropTypes from 'prop-types'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const StyledButton = styled(Button)`
  /* active set background color and remove hover background */
  &.active {
    background-color: var(--color-hl-00);

    span {
      color: black;
    }

    &:hover {
      background-color: var(--color-hl-00);
    }
  }
`

const ViewModeToggle = ({ onChange, value, grouped, setGrouped }) => {
  const items = [
    {
      id: 'list',
      icon: 'format_list_bulleted',
    },
    {
      id: 'grid',
      icon: 'grid_view',
      children: [
        {
          id: 'grouped',
          icon: 'layers',
          isActive: grouped && value === 'grid',
          command: () => value === 'grid' && setGrouped(!grouped),
        },
      ],
    },
  ]

  return (
    <>
      {items.map((item) => (
        <>
          <StyledButton
            icon={item.icon}
            key={item.id}
            onClick={() => onChange(item.id)}
            className={value === item.id ? 'active' : ''}
          />
          {item.children &&
            item.children.map((child) => (
              <StyledButton
                icon={child.icon}
                key={child.id}
                onClick={() => (child.command ? child.command(child.id) : onChange(child.id))}
                className={value === child.id || child.isActive ? 'active' : ''}
              />
            ))}
        </>
      ))}
    </>
  )
}

ViewModeToggle.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
}

export default ViewModeToggle
