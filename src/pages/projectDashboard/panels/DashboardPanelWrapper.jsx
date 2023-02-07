import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

const PanelStyled = styled(Panel)`
  padding: 0;
  padding-top: 8px;
  gap: 0;
  min-height: 64px;
  height: fit-content;
  overflow: hidden;
  align-items: center;

  max-height: 100%;

  h1 {
    font-size: 16px;
    background-color: var(--panel-background);
    margin: 0;
    width: 100%;
    padding: 0 8px;
  }

  h2 {
    width: 100%;
    margin: 7px 0;
  }

  /* set span */
  grid-column: ${({ span }) => `span ${span}`};

  /* if isError make title red */
  ${({ isError }) =>
    isError &&
    css`
      border: 1px solid var(--color-hl-error);
    `}
`
const ContentStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 8px;

  overflow-y: auto;
  overflow-x: clip;
`

const DashboardPanelWrapper = ({ title, children, isError, span = 1, style }) => {
  return (
    <PanelStyled isError={isError} span={span}>
      {title && <h1>{title}</h1>}
      <ContentStyled style={style}>{children}</ContentStyled>
    </PanelStyled>
  )
}

DashboardPanelWrapper.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  isError: PropTypes.bool,
  span: PropTypes.number,
  style: PropTypes.object,
}

export default DashboardPanelWrapper
