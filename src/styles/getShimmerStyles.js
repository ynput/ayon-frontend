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
  color1 = 'var(--color-grey-00)',
  color2 = 'var(--color-grey-01)',
  config = {
    speed: '1s',
  },
) {
  const { speed } = config

  return css`
    background: linear-gradient(to right, ${color1} 8%, ${color2} 18%, ${color1} 33%);
    background-size: 1000px 42px;
    animation: ${shimmerAnimation} ${speed} linear infinite;
    animation-delay: 0.15s;
  `
}

export default getShimmerStyles
