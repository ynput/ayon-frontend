import React from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import getEntityTypeIcon from '@helpers/getEntityTypeIcon'

const StyledNoTasks = styled.div`
  position: absolute;
  top: min(40%, 100px);
  left: 50%;

  .icon {
    background-color: var(--md-sys-color-surface-container-low);
    border: 2px solid var(--md-sys-color-surface-container);
    padding: 12px;
    border-radius: var(--border-radius-m);
    color: var(--md-sys-color-outline-variant);

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

const NoEntityFound = ({ type = 'task', icon }) => {
  let typeIcon = getEntityTypeIcon(type)

  if (icon) typeIcon = icon

  return (
    <StyledNoTasks>
      <Icon icon={typeIcon} />
      <Icon icon={typeIcon} />
      <span>{`No ${type}s found`}</span>
    </StyledNoTasks>
  )
}

export default NoEntityFound
