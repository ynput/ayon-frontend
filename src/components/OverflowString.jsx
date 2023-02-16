import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const SpanStyled = styled.span`
  /* overflow */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const OverflowString = ({ children }) => {
  return <SpanStyled>{children}</SpanStyled>
}

OverflowString.propTypes = {
  children: PropTypes.string.isRequired,
}

export default OverflowString
