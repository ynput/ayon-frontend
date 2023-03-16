import React from 'react'
import PropTypes from 'prop-types'
import UserImagesStacked from '/src/pages/settings/users/UserImagesStacked'
import styled from 'styled-components'

const FieldStyled = styled.div`
  position: relative;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;

  &:not(:hover) {
    transition: background-color 0.1s;
  }

  &:hover {
    background-color: var(--color-grey-02);
  }
`

const AssigneeField = ({ value = [], onClick }) => {
  return (
    <FieldStyled onClick={onClick}>
      <UserImagesStacked users={value} size={22} gap={-0.3} />
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
}

export default AssigneeField
