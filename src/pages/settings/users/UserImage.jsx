import React from 'react'
import Proptypes from 'prop-types'
import styled, { css } from 'styled-components'

const CircleImage = styled.div`
  border-radius: 100%;
  aspect-ratio: 1/1;

  width: 30px;
  max-height: 30px;
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

  /* if highlight true make border green */
  ${({ highlight }) =>
    highlight &&
    css`
      border-color: var(--toastify-color-success);
    `}
`

const UserImage = ({ src, fullName, style, size = 30, highlight }) => {
  const fontSize = Math.round((13 / 30) * size)

  const initials = fullName
    ?.split(' ')
    .map((w) => w[0]?.toUpperCase())
    .splice(0, 2)
    .join('')

  return (
    <CircleImage style={{ width: size, maxHeight: size, ...style }} highlight={highlight}>
      {src ? <img src={src} /> : <span style={{ fontSize: `${fontSize}px` }}>{initials}</span>}
    </CircleImage>
  )
}

UserImage.propTypes = {
  src: Proptypes.string,
  fullName: Proptypes.string,
  size: Proptypes.number,
  style: Proptypes.object,
  highlight: Proptypes.bool,
}

export default UserImage
