import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { UserImagesStacked } from '@ynput/ayon-react-components'

const FieldStyled = styled.div`
  position: relative;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  height: 30px;
  gap: 4px;

  span {
    position: relative;
    top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ${({ disabled }) =>
    disabled &&
    css`
      color: var(--color-text-dim);
      span {
        color: var(--color-text-dim);
      }
      img {
        opacity: 0.75;
      }
      background-color: var(--input-disabled-background-color);
    `}

  ${({ isMultiple }) =>
    isMultiple &&
    css`
      ::before {
        content: 'Multiple (';
        margin-right: 4px;
      }

      ::after {
        content: ')';
        margin-left: 4px;
      }
    `}
`

const AssigneeField = ({
  value = [],
  onClick,
  style,
  disabled,
  isMultiple,
  placeholder,
  emptyIcon = true,
  emptyMessage = '',
}) => {
  return (
    <FieldStyled
      onClick={!disabled ? onClick : undefined}
      style={style}
      disabled={disabled}
      isMultiple={isMultiple && (!disabled || !placeholder)}
    >
      {!(disabled && placeholder) ? (
        value.length ? (
          <>
            <UserImagesStacked users={value} size={21} gap={-0.3} />
            {value.length < 2 && <span>{value[0]?.fullName}</span>}
          </>
        ) : (
          <>
            {emptyIcon && !isMultiple && (
              <span className="material-symbols-outlined">add_circle</span>
            )}
            {emptyMessage && <span>{emptyMessage}</span>}
          </>
        )
      ) : (
        <span>{placeholder}</span>
      )}
    </FieldStyled>
  )
}

AssigneeField.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      fullName: PropTypes.string,
      avatarUrl: PropTypes.string,
    }),
  ).isRequired,
  onClick: PropTypes.func,
  editable: PropTypes.bool,
  style: PropTypes.object,
  disabled: PropTypes.bool,
  isMultiple: PropTypes.bool,
  placeholder: PropTypes.string,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.bool,
}

export default AssigneeField
