import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import UserImage from './UserImage'

const StackedStyled = styled.div`
  position: relative;
  display: flex;
  z-index: 10;
  & > * + * {
    margin-left: ${({ gap }) => `${gap}px`};
  }
`

const UserImagesStacked = ({ users = [], size = 30, gap = -1, max = 5 }) => {
  const length = users.length
  // limit to 5 users
  users = users.slice(0, max)

  // show extras
  if (length > max) {
    users.push({ fullName: `+ ${length - max > 9 ? '+' : length - max}` })
  }

  return (
    <StackedStyled length={users.length} gap={(gap * 30) / 2}>
      {users.map((user, i) => (
        <UserImage
          src={user.avatarUrl}
          key={i}
          fullName={user.fullName}
          style={{ zIndex: -i }}
          highlight={user.self}
          size={size}
        />
      ))}
    </StackedStyled>
  )
}

UserImagesStacked.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      avatarUrl: PropTypes.string,
      fullName: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  size: PropTypes.number,
  gap: PropTypes.number,
  max: PropTypes.number,
}

export default UserImagesStacked
