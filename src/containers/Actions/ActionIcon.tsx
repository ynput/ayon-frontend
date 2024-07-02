import { IconModel } from '@/api/rest'
import { Icon } from '@ynput/ayon-react-components'
import { FC } from 'react'

interface ActionIconProps {
  icon: IconModel | undefined
}

const ActionIcon: FC<ActionIconProps> = ({ icon }) => {
  let component

  if (icon?.type === 'material-symbols' && icon?.name) {
    component = <Icon icon={icon.name} style={{ color: icon.color }} />
  } else if (icon?.type === 'url') {
    component = <img src={icon.url} title="Action" />
  } else {
    component = <Icon icon="manufacturing" />
  }

  return component
}

export default ActionIcon
