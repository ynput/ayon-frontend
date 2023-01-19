import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import UserImage from './UserImage'

const StackedStyled = styled.div`
  display: flex;
  z-index: 10;
  & > * + * {
    margin-left: ${({ length }) => `${Math.max(-20, -length * 1.5 - 8)}px`};
  }
`

const UserImagesStacked = ({ users = [] }) => {
  return (
    <StackedStyled length={users.length}>
      {users.map((user, i) => (
        <UserImage src={user.src} key={i} fullName={user.fullName} style={{ zIndex: -i }} />
      ))}
    </StackedStyled>
  )
}

UserImagesStacked.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string,
      fullName: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
}

export default UserImagesStacked
