import { Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { ShowProductsSwitch } from './ShowProductsSwitch'
import VersionsSearchFilter from './VersionsSearchFilter'
import { TableGridSwitch } from '@shared/components'
import { useVersionsViewSettings } from '@shared/containers'

interface VersionsToolbarProps {}

const VersionsToolbar: FC<VersionsToolbarProps> = ({}) => {
  const { showGrid, onUpdateShowGrid } = useVersionsViewSettings()

  return (
    <Toolbar>
      <VersionsSearchFilter />
      <ShowProductsSwitch />
      <TableGridSwitch showGrid={showGrid} onChange={(value) => onUpdateShowGrid(value)} />
    </Toolbar>
  )
}

export default VersionsToolbar
