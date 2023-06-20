import styled, { keyframes } from 'styled-components'

// bouncing dot animation
const bounce = keyframes`
  0%, 100% {
    translate: 0 -80px;
  }
  50% {
    translate: 0 0;
  }  
`

const pulse = keyframes`
  25% {
    scale: 0.9;
  }
  50% {
    scale: 1;
    rotate: 0deg;
  }
  65% {
    rotate: 0deg;
  }
  75% {
    scale: 0.7;
    /* rotate: 0deg; */
  }
  95% {
    rotate: 360deg;
  }
  100% {
    scale: 1;
    rotate: 360deg;
  }
`

const StyledLoader = styled.div`
  position: fixed;
  inset: 0;
  background-color: var(--color-grey-01);
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    opacity: 0.8;
    width: 150px;
    /* animation */
    animation: ${pulse} 1.4s ease-in-out infinite;
    animation-delay: -1s;

    .dot {
      animation: ${bounce} 0.7s cubic-bezier(0.58, 0.01, 0.44, 0.97) infinite;
      animation-delay: -1s;
    }
  }
`

const LoadingPage = () => {
  return (
    <StyledLoader>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 513 513"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          fillRule: 'evenodd',
          clipRule: 'evenodd',
          strokeLinejoin: 'round',
          strokeMiterlimit: 2,
        }}
      >
        <g transform="matrix(1,0,0,1,-3833,-2061)">
          <g transform="matrix(0.82183,0,0,1.58025,2897.72,1354.87)">
            <rect id="Y_green" x="1139" y="447" width="623" height="324" style={{ fill: 'none' }} />
            <g id="Y_green1">
              <g id="symbol" transform="matrix(1.77413,0,0,0.922664,-1122.88,47.0979)">
                <g transform="matrix(-2.19911,-1.26966,-1.26966,2.19911,1357.18,508.296)">
                  <rect
                    x="-38.053"
                    y="10.196"
                    width="44"
                    height="12.001"
                    style={{ fill: 'white' }}
                  />
                </g>
                <g transform="matrix(-1.26959,-2.19915,-2.19915,1.26959,1585.08,579.033)">
                  <rect
                    x="10.051"
                    y="-5.803"
                    width="12.002"
                    height="43.999"
                    style={{ fill: 'white' }}
                  />
                </g>
                <g transform="matrix(-2.53932,0,0,2.53932,2519.41,83.268)">
                  <rect x="414.945" y="221.035" width="12" height="44" style={{ fill: 'white' }} />
                </g>
                <g transform="matrix(0,-2.53932,-2.53932,0,1450.5,462.224)" className="dot">
                  <path
                    d="M-12,-12C-18.627,-12 -24,-6.627 -24,0C-24,6.627 -18.627,12 -12,12C-5.373,12 0,6.627 0,0C0,-6.627 -5.373,-12 -12,-12"
                    style={{ fill: 'white', fillRule: 'nonzero' }}
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </StyledLoader>
  )
}

export default LoadingPage
