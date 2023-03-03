import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import OverflowField from './OverflowField'

const AttributeTableRow = styled.div`
  display: flex;
  flex-direction: row;
  position: relative;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  gap: 8px;
  border-top: 1px solid var(--color-grey-01);
  &:first-child {
    border-top: none !important;
  }
  span:first-child {
    white-space: nowrap;
  }
`

const TableRow = ({ name, value }) => {
  return (
    <AttributeTableRow>
      <span>{name}</span>
      <OverflowField value={value} />
    </AttributeTableRow>
  )
}

TableRow.propTypes = {
  name: PropTypes.string.isRequired,
}

export default TableRow
