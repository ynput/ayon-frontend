import { getShimmerStyles } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Icon = styled.div`
  position: relative;
  &,
  img {
    width: ${({ $size }) => `${$size}px` || '64px'};
    height: ${({ $size }) => `${$size}px` || '64px'};
  }

  img {
    object-fit: contain;
  }

  &.isLoading {
    ${getShimmerStyles(undefined, undefined, { opacity: 1 })}
    border-radius: 100%;
    img {
      opacity: 0;
    }
    overflow: hidden;
  }

  .icon {
    font-size: ${({ $size }) => `${$size}px` || '64px'};
  }
`
