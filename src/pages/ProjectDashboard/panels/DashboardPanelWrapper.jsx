import React from 'react'
import { Panel, Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const PanelStyled = styled(Panel)`
  padding: 0;

  gap: 0;
  min-height: 64px;
  height: fit-content;
  align-items: center;
  position: relative;

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
`
const ContentStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  width: 100%;
  padding: 8px;
  padding-top: 0;

  /* overflow-y: auto;
  overflow-x: clip; */
`

const IconStyled = styled(Button)`
  background-color: var(--panel-background);
  padding: 1px;
  height: 100%;
  min-width: unset;
  min-height: unset;
`

const DashboardPanelWrapper = ({
  title,
  children,
  span = 1,
  style,
  stylePanel,
  header,
  icon,
  ...props
}) => {
  return (
    <PanelStyled span={span} style={stylePanel} {...props}>
      {title && (
        <header>
          <h1>{title}</h1>
          {header && header}
          {icon?.onClick && <IconStyled icon={icon?.icon} onClick={icon.onClick} />}
          {icon?.link && (
            <Link to={icon.link} onClick={icon.onClick} data-tooltip={icon.tooltip}>
              <IconStyled icon={icon?.icon} />
            </Link>
          )}
        </header>
      )}

      <ContentStyled style={style}>{children}</ContentStyled>
    </PanelStyled>
  )
}

export default DashboardPanelWrapper
