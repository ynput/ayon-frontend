import { Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { ShowProductsSwitch } from './ShowProductsSwitch'
import VersionsSearchFilter from './VersionsSearchFilter'

interface VersionsToolbarProps {}

const VersionsToolbar: FC<VersionsToolbarProps> = ({}) => {
  return (
    <Toolbar>
      <VersionsSearchFilter />
      <ShowProductsSwitch />
    </Toolbar>
  )
}

export default VersionsToolbar
