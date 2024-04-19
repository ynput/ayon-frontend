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
  z-index: 500;
  width: 100%;
  max-width: 533px;

  z-index: 200;

  transition: translate 300ms ease;
  translate: 0 0;

  &.slideOutShown {
    translate: calc(-100% - 8px) 0;
  }

  /* animation: ${slideOutFromRight} 0.3s forwards; */
`
