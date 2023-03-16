import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'

const hoverStyle = css`
  background-color: var(--color-grey-02);
  color: ${({ color }) => color};
`

const invertHoverStyle = css`
  /* flips the bg color for text color */
  background-color: ${({ color }) => color};
  color: black;
`
const defaultStyle = css`
  /* default text color */
  color: ${({ color }) => color};
  background-color: transparent;
`

const StatusStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--base-font-size);
  position: relative;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 8px;

  /* ICON */
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 1, 'wght' 100, 'GRAD' 200, 'opsz' 20;
    /* always taks parents color */
    color: inherit;
  }

  border-radius: var(--border-radius);
  /* same height as a row */
  height: 27px;
  min-height: 27px;

  ${defaultStyle}

  /* selecting styles */
  ${({ isSelecting }) =>
    isSelecting &&
    css`
      border-radius: 0;
      height: 27px;
      min-height: 27px;
    `}




    /* Only happens when a change has been made and dropdown closed */
    ${({ isChanging, isSelecting }) =>
    isChanging &&
    !isSelecting &&
    css`
      ${invertHoverStyle}
    `}

    /* A transition animation for onChange animation */
    ${({ isSelecting }) =>
    !isSelecting &&
    css`
      &:not(:hover) {
        transition: background-color 0.1s, color 0.3s;
      }
    `}


  /* sets for hover and when active whilst open (top one) */
  :hover {
    ${hoverStyle}
  }

  /* keeps the active field at the top */
  order: 2;
  ${({ isActive, isSelecting }) =>
    isActive &&
    isSelecting &&
    css`
      /* hover always on at top */
      order: 1;
      ${invertHoverStyle}

      :hover {
        ${invertHoverStyle}
      }
    `}

  /* ALIGNMENT */
  ${({ align }) =>
    align === 'right' &&
    css`
      justify-content: end;

      span {
        order: 2;
      }
    `}

    /* ICON ONLY STYLES */
      ${({ size }) =>
    size === 'icon' &&
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
  align = 'left',
  onClick,
  style,
  height,
  placeholder,
  statuses = {},
}) => {
  const { shortName, color, icon } = statuses[value] || {}

  let shownValue = value || placeholder || ''

  return (
    <StatusStyled
      style={{ ...style, height }}
      onClick={onClick}
      color={color}
      isActive={isActive}
      id={shownValue}
      isSelecting={isSelecting}
      align={align}
      isChanging={isChanging}
      size={size}
      placeholder={!value && placeholder ? placeholder : ''}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {size !== 'icon' && (size === 'full' ? shownValue : shortName)}
    </StatusStyled>
  )
}

StatusField.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  isActive: PropTypes.bool,
  isChanging: PropTypes.bool,
  isSelecting: PropTypes.bool,
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  align: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  style: PropTypes.object,
  anatomy: PropTypes.object,
  placeholder: PropTypes.string,
  statuses: PropTypes.object,
}

export default StatusField
