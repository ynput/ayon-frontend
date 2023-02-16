import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import copyToClipboard from '../helpers/copyToClipboard'

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

const OverflowString = styled.span`
  /* overflow */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  padding: 0 4px;
`

const RevealString = styled.span`
  position: absolute;
  right: 0;
  background-color: var(--color-grey-01);
  border-radius: 3px;

  word-break: break-all;
  padding: 0 4px;
  cursor: pointer;
  max-width: 90%;
  z-index: 10;

  transition: height 0.2s;
  overflow-y: hidden;
  height: 18px;

  opacity: 0;

  :hover {
    opacity: 1;
    height: auto;
    padding: 4px;
    box-shadow: 0 0 8px 0 rgb(0 0 0 / 20%);
    transition: opacity 0.2s;
  }
`

const TableRow = ({ name, value }) => {
  return (
    <AttributeTableRow>
      <span>{name}</span>
      <OverflowString>{value}</OverflowString>
      <RevealString onClick={() => copyToClipboard(value)}>{value}</RevealString>
    </AttributeTableRow>
  )
}

TableRow.propTypes = {
  name: PropTypes.string.isRequired,
}

export default TableRow
