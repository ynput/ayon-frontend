import React from 'react'
import Proptypes from 'prop-types'
import styled from 'styled-components'

const CircleImage = styled.div`
  border-radius: 100%;
  width: 30px;
  height: 30px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  overflow: hidden;
  background-color: var(--color-grey-03);
  border: solid 1px var(--color-grey-06);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const UserImage = ({ src, fullName, style }) => {
  const initials = fullName
    ?.split(' ')
    .map((w) => w[0]?.toUpperCase())
    .splice(0, 2)
    .join('')

  return (
    <CircleImage style={style}>{src ? <img src={src} /> : <span>{initials}</span>}</CircleImage>
  )
}

UserImage.propTypes = {
  src: Proptypes.string,
  fullName: Proptypes.string.isRequired,
}

export default UserImage
