import { css, keyframes } from 'styled-components'

const shimmerAnimation = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`

function getShimmerStyles(
  color1 = 'var(--md-sys-color-surface-container-high)',
  color2 = 'var(--md-sys-color-surface-container-high-hover)',
  config = {},
) {
  const { speed = '1.2s', opacity = 0.25 } = config

  return css`
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, ${color1} 8%, ${color2} 18%, ${color1} 33%);
      background-size: 1000px 42px;
      animation: ${shimmerAnimation} ${speed} linear infinite;
      animation-delay: 0.15s;
      opacity: ${opacity};
    }
  `
}

export default getShimmerStyles
