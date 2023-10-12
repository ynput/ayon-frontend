import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'
import { formatDistance } from 'date-fns'

// styled panel
const PanelStyled = styled(Panel)`
  flex-direction: row;
  align-items: center;
  background-color: var(--md-sys-color-surface-container-high);
  overflow: hidden;

  span {
    white-space: nowrap;
  }

  header {
    overflow: hidden;
    display: inline-block;

    & > * {
      white-space: nowrap;
      /* TODO: get text ellipsis working */
    }
  }

  /* if not disable hover */
  ${({ disableHover }) =>
    !disableHover &&
    css`
      &:hover {
        background-color: var(--md-sys-color-surface-container-high-hover);
        cursor: pointer;
      }
    `}
`

const EventTile = ({ title = '', subTitle = '', time, children, onClick, disableHover }) => {
  return (
    <PanelStyled onClick={onClick} disableHover={disableHover}>
      <header style={{ flex: 1 }}>
        <strong>{title}</strong>
        <br />
        <span style={{ opacity: 0.5 }}>{subTitle}</span>
      </header>
      {time && (
        <span style={{ textAlign: 'end', opacity: 0.5 }}>
          {formatDistance(new Date(time), new Date(), { addSuffix: true })}
        </span>
      )}
      {children}
    </PanelStyled>
  )
}

EventTile.propTypes = {
  title: PropTypes.string,
  subTitle: PropTypes.string,
  time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node,
  onClick: PropTypes.func,
  disableHover: PropTypes.bool,
}

export default EventTile
