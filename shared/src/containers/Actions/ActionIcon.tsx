import { IconModel } from '@shared/api'
import { Icon } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled, { keyframes } from 'styled-components'

const spinning = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const SpinningIcon = styled(Icon)`
  .icon {
    animation: ${spinning} 1s linear infinite;
  }
`

interface ActionIconProps {
  icon: IconModel | undefined
  isExecuting?: boolean
}

const ActionIcon: FC<ActionIconProps> = ({ icon, isExecuting }) => {
  let component

  if (isExecuting) component = <SpinningIcon icon="sync" />
  else if (icon?.type === 'material-symbols' && icon?.name) {
    component = <Icon icon={icon.name} style={{ color: icon.color }} />
  } else if (icon?.type === 'url') {
    component = <img src={icon.url} title="Action" />
  } else {
    component = <Icon icon="category" />
  }

  return component
}

export default ActionIcon
