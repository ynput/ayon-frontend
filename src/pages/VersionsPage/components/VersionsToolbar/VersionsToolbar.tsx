import { Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { VersionsStackedSwitch } from './VersionsStackedSwitch'
import VersionsSearchFilter from './VersionsSearchFilter'

interface VersionsToolbarProps {}

const VersionsToolbar: FC<VersionsToolbarProps> = ({}) => {
  return (
    <Toolbar>
      <VersionsSearchFilter />
      <VersionsStackedSwitch />
    </Toolbar>
  )
}

export default VersionsToolbar
