import React from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

const StyledNoTasks = styled.div`
  position: absolute;
  top: 40%;
  left: 50%;

  .icon {
    background-color: var(--md-sys-color-surface-container-low);
    border: 2px solid var(--color-grey-01);
    padding: 12px;
    border-radius: var(--border-radius);
    color: var(--color-grey-03);

    transform-origin: bottom center;

    position: absolute;

    user-select: none;
  }

  .icon:first-child {
    transform: translate(-50%, -100%) rotate(-20deg) translateX(-10px);
  }

  .icon:nth-child(2) {
    transform: translate(-50%, -100%) rotate(20deg) translateX(10px);
  }

  span:last-child {
    opacity: 0.5;
    position: absolute;
    white-space: nowrap;
    transform: translate(-50%, 100%);
    bottom: -30px;
  }
`

const NoTasks = () => {
  return (
    <StyledNoTasks>
      <Icon icon="check_circle" />
      <Icon icon="check_circle" />
      <span>No tasks found</span>
    </StyledNoTasks>
  )
}

export default NoTasks
