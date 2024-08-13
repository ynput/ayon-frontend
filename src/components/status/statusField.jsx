import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

const hoverStyle = css`
  background-color: var(--md-sys-color-surface-container-low-hover);
  color: ${({ $color }) => $color};
`

const invertHoverStyle = css`
  /* flips the bg color for text color */
  background-color: ${({ $color }) => $color};
  color: black;
`
const defaultStyle = css`
  /* default text color */
  color: ${({ $color }) => $color};
  background-color: transparent;
`

const StatusStyled = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  font-size: var(--base-font-size);
  position: relative;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 8px;
  justify-content: space-between;
  max-height: 160px;
  width: 100%;

  /* STATUS ICON */
  .status-icon {
    font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 300, 'opsz' 20;
    /* always takes parents color */
    color: inherit;
  }

  border-radius: var(--border-radius-m);
  /* same height as a row */
  height: 27px;
  min-height: 27px;

  .status-texticon {
    display: flex;
  }

  .status-text {
    margin-left: 8px;
  }

  ${defaultStyle}

  /* Styles for highlighting changed status */
  ${({ $isChanged }) =>
    $isChanged &&
    css`
      background-color: var(--md-sys-color-primary);

      &,
      span,
      .icon {
        color: var(--md-sys-color-on-primary);
      }

      &:hover {
        background-color: var(--md-sys-color-primary-hover);
      }
    `}

  /* selecting styles */
  ${({ $isSelecting }) =>
    $isSelecting &&
    css`
      border-radius: 0;
      height: 27px;
      min-height: 27px;
    `}




    /* Only happens when a change has been made and dropdown closed */
    /* or invert prop */
    ${({ $isChanging, $isSelecting, $invert }) =>
    ($isChanging && !$isSelecting) ||
    ($invert &&
      css`
        ${invertHoverStyle}
      `)}


    /* A transition animation for onChange animation */
    ${({ $isSelecting }) =>
    !$isSelecting &&
    css`
      &:not(:hover) {
        transition: background-color 0.1s, color 0.3s;
      }
    `}


  /* sets for hover and when active whilst open (top one) */
  &:hover {
    /* ${hoverStyle} */
    filter: brightness(110%);
  }

  ${({ $isActive, $isSelecting }) =>
    $isActive &&
    $isSelecting &&
    css`
      ${invertHoverStyle}

      &:hover {
        ${invertHoverStyle}
      }
      [icon='expand_more'] {
        transform: rotate(180deg);
        ${invertHoverStyle}
      }
    `}

  /* ICON ONLY STYLES */
      ${({ $size }) =>
    $size === 'icon' &&
    css`
      width: 100%;

      span {
        margin: auto;
      }
    `}
`

// RENDER
const StatusField = ({
  value,
  isActive,
  isChanging,
  isSelecting,
  size = 'full',
  style,
  height,
  placeholder,
  statuses = {},
  invert,
  className,
  isChanged,
  ...props
}) => {
  const {
    shortName,
    color = 'var(--md-sys-color-surface-container-highest)',
    icon = 'help_center',
  } = statuses[value] || {}

  let shownValue = value || placeholder || 'None'

  return (
    <StatusStyled
      {...props}
      style={{ ...style, height }}
      id={shownValue}
      $color={color}
      $isActive={isActive}
      $isSelecting={isSelecting}
      $isChanging={isChanging}
      $size={size}
      $invert={invert}
      $isChanged={isChanged}
      placeholder={!value && placeholder ? placeholder : ''}
      className={className + ' status-field'}
    >
      <div className="status-texticon">
        {icon && <Icon className="status-icon" icon={icon} />}
        <span className="status-text">
          {size !== 'icon' && (size === 'full' ? shownValue : shortName)}
        </span>
      </div>
    </StatusStyled>
  )
}

StatusField.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  isActive: PropTypes.bool,
  isChanging: PropTypes.bool,
  isSelecting: PropTypes.bool,
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  onClick: PropTypes.func,
  style: PropTypes.object,
  anatomy: PropTypes.object,
  placeholder: PropTypes.string,
  statuses: PropTypes.object,
}

export default StatusField
