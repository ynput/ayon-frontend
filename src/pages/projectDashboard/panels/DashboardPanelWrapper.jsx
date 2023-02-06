import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

const PanelStyled = styled(Panel)`
  padding: 8px;
  gap: 8px;
  min-height: 64px;
  overflow: hidden;

  h1 {
    margin: 5px 0;
    font-size: 16px;
  }

  /* if isError make title red */
  ${({ isError }) =>
    isError &&
    css`
      border: 1px solid var(--color-hl-error);
      margin: -1px;
    `}
`

const DashboardPanelWrapper = ({ title, children, isError }) => {
  return (
    <PanelStyled isError={isError}>
      {title && (
        <h1>
          {title}
          {isError && ' - Error'}
        </h1>
      )}
      {children}
    </PanelStyled>
  )
}

DashboardPanelWrapper.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  isError: PropTypes.bool,
}

export default DashboardPanelWrapper
