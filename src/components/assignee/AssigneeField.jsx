import React from 'react'
import PropTypes from 'prop-types'
import UserImagesStacked from '/src/pages/settings/users/UserImagesStacked'
import styled, { css } from 'styled-components'

const FieldStyled = styled.div`
  position: relative;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  height: 30px;

  &:not(:hover) {
    transition: background-color 0.1s;
  }

  &:hover {
    background-color: var(--color-grey-02);
  }

  ${({ disabled }) =>
    disabled &&
    css`
      color: var(--color-text-dim);
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
      isMultiple={isMultiple && !disabled}
    >
      {!(disabled && placeholder) ? (
        value.length ? (
          <UserImagesStacked users={value} size={21} gap={-0.3} />
        ) : (
          <>
            {emptyIcon && <span className="material-symbols-outlined">add_circle</span>}
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
      fullName: PropTypes.string.isRequired,
      avatarUrl: PropTypes.string.isRequired,
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
