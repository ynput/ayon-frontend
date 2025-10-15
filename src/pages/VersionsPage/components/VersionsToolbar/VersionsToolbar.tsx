import { Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { VersionsStackedSwitch } from './VersionsStackedSwitch'

interface VersionsToolbarProps {}

const VersionsToolbar: FC<VersionsToolbarProps> = ({}) => {
  return (
    <Toolbar>
      <VersionsStackedSwitch />
    </Toolbar>
  )
}

export default VersionsToolbar
