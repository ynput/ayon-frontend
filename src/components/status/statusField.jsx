import React from 'react'
import PropTypes from 'prop-types'
import { statusSizeType } from './statusSelect'
import { getStatusColor } from '/src/utils'

const StatusField = ({ value, icon, isActive, isSelecting, size }) => {
  const color = getStatusColor(value)

  return <span style={{ color }}>{value}</span>
}

StatusField.propTypes = {
  value: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  isSelecting: PropTypes.bool,
  size: statusSizeType,
}

export default StatusField
