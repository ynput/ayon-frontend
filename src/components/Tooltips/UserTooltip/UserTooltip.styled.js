import styled, { keyframes } from 'styled-components'

const popInAnimation = keyframes`
    from {
        opacity: 0.4;
        scale: 0.9;
    }
    to {
        opacity: 1;
        scale: 1;
    }
`

export const Popup = styled.span`
  display: flex;
  padding: 8px;
  gap: var(--base-gap-large);
  z-index: 100;
  align-items: center;

  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);

  position: fixed;
  transform: translate(-50%, calc(-100% - 4px));
  box-shadow: 0 0px 4px rgba(0, 0, 0, 0.2);
  z-index: 9999;

  .thumbnail {
    width: 40px;
    height: 40px;

    .icon {
      font-size: 24px;
    }
  }

  animation: ${popInAnimation} 50ms ease-out;
  transform-origin: left bottom;
`

export const Content = styled.span`
  display: flex;
  flex-direction: column;

  span {
    white-space: nowrap;
  }
`
