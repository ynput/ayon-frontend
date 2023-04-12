import React from 'react'
import PropTypes from 'prop-types'
import { Panel, Button } from 'ayon-react-components-test'
import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'

const PanelStyled = styled(Panel)`
  padding: 0;

  gap: 0;
  min-height: 64px;
  height: fit-content;
  align-items: center;

  min-height: fit-content;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    width: 100%;
  }

  h1 {
    font-size: 16px;
    background-color: var(--panel-background);
    margin: 0;
    text-align: left;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* sub title */
  h2 {
    width: 100%;
    margin: 4px 0;
    display: flex;
    justify-content: space-between;

    span:last-child {
      font-weight: normal;
    }
  }

  /* set span */
  grid-column: ${({ span }) => `span ${span}`};

  /* if isError make title red */
  ${({ isError }) =>
    isError &&
    css`
      border: 1px solid var(--color-hl-error);
    `}

  /* isLoading children opacity 0.25  */
  ${({ isLoading }) =>
    isLoading &&
    css`
      & > *:not(header) {
        opacity: 0.25;
      }
    `}
`
const ContentStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 8px;
  padding-top: 0;

  /* overflow-y: auto;
  overflow-x: clip; */
`

const IconStyled = styled(Button)`
  background-color: var(--panel-background);
  padding: 1px;
  width: 100%;
  height: 100%;
  min-width: unset;
  min-height: unset;
`

const DashboardPanelWrapper = ({
  title,
  children,
  isError,
  span = 1,
  style,
  stylePanel,
  header,
  icon,
  isLoading,
}) => {
  return (
    <PanelStyled isError={isError} span={span} style={stylePanel} isLoading={isLoading}>
      {title && (
        <header>
          <h1>{title}</h1>
          {header && header}
          {icon?.onClick && <IconStyled icon={icon?.icon} onClick={icon.onClick} />}
          {icon?.link && (
            <Link to={icon.link} onClick={icon.onClick}>
              <IconStyled icon={icon?.icon} />
            </Link>
          )}
        </header>
      )}

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
  stylePanel: PropTypes.object,
  header: PropTypes.node,
  icon: PropTypes.shape({
    link: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.string.isRequired,
  }),
}

export default DashboardPanelWrapper
