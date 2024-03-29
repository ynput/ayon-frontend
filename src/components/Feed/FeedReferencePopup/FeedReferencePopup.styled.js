import styled, { keyframes } from 'styled-components'

const popInAnimation = keyframes`
    from {
        opacity: 0.4;
        scale: 0.8;
        translate: 0 -10px;
    }
    to {
        opacity: 1;
        scale: 1;
        translate: 0 0;
    }
`

export const Popup = styled.span`
  display: flex;
  padding: 8px;
  gap: 8px;
  z-index: 100;
  align-items: center;

  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);

  position: fixed;
  transform: translate(-50%, calc(-100% - 8px));
  box-shadow: 0 0px 4px rgba(0, 0, 0, 0.2);

  .thumbnail {
    width: 40px;
    height: 40px;

    .icon {
      font-size: 24px;
    }
  }

  animation: ${popInAnimation} 0.05s;
  transform-origin: left bottom;
`

export const Content = styled.span`
  display: flex;
  flex-direction: column;

  span {
    white-space: nowrap;
  }
`
