import type { IconModel } from '@shared/api'
import { Icon, isReadableOnLight, MIN_CONTRAST_ICON } from '@ynput/ayon-react-components'
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

// addons often declare white icons for the dark theme; on light they would read as disabled,
// so a colour too light for the surface falls back to the text colour there
const getIconColor = (color?: string | null) => {
  if (!color || isReadableOnLight(color, MIN_CONTRAST_ICON)) return color ?? undefined
  return `light-dark(var(--md-sys-color-on-surface), ${color})`
}

interface ActionIconProps {
  icon: IconModel | undefined
  isExecuting?: boolean
}

const ActionIcon: FC<ActionIconProps> = ({ icon, isExecuting }) => {
  let component

  if (isExecuting) component = <SpinningIcon icon="sync" />
  else if (icon?.type === 'material-symbols' && icon?.name) {
    component = <Icon icon={icon.name} style={{ color: getIconColor(icon.color) }} />
  } else if (icon?.type === 'url') {
    component = <img src={icon.url} title="Action" />
  } else {
    component = <Icon icon="category" />
  }

  return component
}

export default ActionIcon
