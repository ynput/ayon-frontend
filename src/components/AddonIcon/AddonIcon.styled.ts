import styled from 'styled-components'

type IconProps = {
  $size?: number
}

export const Icon = styled.div<IconProps>`
  position: relative;
  &,
  img {
    width: ${({ $size }) => `${$size}px` || '64px'};
    height: ${({ $size }) => `${$size}px` || '64px'};
  }

  img {
    object-fit: contain;
  }

  &.loading {
    border-radius: 100%;
  }

  .icon {
    font-size: ${({ $size }) => `${$size}px` || '64px'};
  }
`
