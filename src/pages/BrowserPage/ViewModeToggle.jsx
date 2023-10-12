import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Button } from '@ynput/ayon-react-components'

const ViewModeToggle = ({ onChange, value, grouped, setGrouped }) => {
  const handleNormalClick = (id) => {
    setGrouped(false)
    onChange(id)
  }

  const handleGroupClick = () => {
    // set to grid
    onChange('grid')
    // set grouped
    setGrouped(true)
  }

  const items = [
    {
      id: 'list',
      icon: 'format_list_bulleted',
      onClick: () => handleNormalClick('list'),
      title: 'List View',
    },
    {
      id: 'grid',
      icon: 'grid_view',
      onClick: () => handleNormalClick('grid'),
      title: 'Grid View',
    },
    {
      id: 'layers',
      icon: 'layers',
      onClick: () => handleGroupClick(),
      title: 'Grouped View',
    },
  ]

  if (grouped) value = 'layers'

  return (
    <>
      {items.map((item) => (
        <Button
          key={item.id}
          className={value === item.id ? 'active' : ''}
          selected={value === item.id}
          {...item}
        />
      ))}
    </>
  )
}

ViewModeToggle.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
}

export default ViewModeToggle
