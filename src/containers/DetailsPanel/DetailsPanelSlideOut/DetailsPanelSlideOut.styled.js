import styled, { keyframes } from 'styled-components'

const slideOutFromRight = keyframes`
from {
  translate: 0 0;
}
to {
  translate: calc(-100% - 8px) 0;

}
`

export const SlideOut = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 200;
  width: 100%;
  max-width: 533px;

  animation: ${slideOutFromRight} 0.2s ease forwards;
`
