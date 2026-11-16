import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Icon, getTextColor } from '@ynput/ayon-react-components'

// text on the status colour; a status without one has a theme colour, which follows the theme
const textOn = (color) =>
  color.startsWith('var(') ? 'var(--md-sys-color-on-surface)' : getTextColor(color)

// the whole field filled with the status colour
const invertHoverStyle = css`
  background-color: ${({ $color }) => $color};
  color: ${({ $color }) => textOn($color)};
`
// filled as a whole: the block inside it has nothing to add
const plainTextIcon = css`
  .status-texticon {
    background-color: transparent;
    color: inherit;
    padding-left: 0;
    padding-right: 0;
  }
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
    font-variation-settings: 'FILL' 1;
    /* always takes parents color */
    color: inherit;
  }

  border-radius: var(--border-radius-m);
  /* same height as a row */
  height: 27px;
  min-height: 27px;

  /* the status colour is a block behind the icon and name, never their colour, so it reads on any surface */
  .status-texticon {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 6px;
    border-radius: var(--border-radius-m);
    background-color: ${({ $color }) => $color};
    color: ${({ $color }) => textOn($color)};
  }

  .status-text {
    padding-right: 2px;
    &:empty {
      display: none;
    }
  }

  color: var(--md-sys-color-on-surface);
  background-color: transparent;

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
      ${plainTextIcon}
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
        ${plainTextIcon}
      `)}


    /* A transition animation for onChange animation */
    ${({ $isSelecting }) =>
    !$isSelecting &&
    css`
      &:not(:hover) {
        transition: background-color 0.1s, color 0.3s;
      }
    `}


  &:hover {
    filter: brightness(110%);
  }

  /* the current status in the list */
  ${({ $isActive, $isSelecting }) =>
    $isActive &&
    $isSelecting &&
    css`
      background-color: var(--md-sys-color-primary-container);
      [icon='expand_more'] {
        transform: rotate(180deg);
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

      /* the icon alone: a square block with even padding */
      .status-texticon {
        margin: auto;
        padding: 2px;
        aspect-ratio: 1;
        justify-content: center;
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
