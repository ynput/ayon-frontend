import { Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { ShowProductsSwitch } from './ShowProductsSwitch'
import VersionsSearchFilter from './VersionsSearchFilter'
import { TableGridSwitch } from '@shared/components'
import { useVersionsViewsContext } from '@pages/VersionsPage/context/VersionsViewsContext'

interface VersionsToolbarProps {}

const VersionsToolbar: FC<VersionsToolbarProps> = ({}) => {
  const { showGrid, onUpdateShowGrid } = useVersionsViewsContext()

  return (
    <Toolbar>
      <VersionsSearchFilter />
      <ShowProductsSwitch />
      <TableGridSwitch showGrid={showGrid} onChange={(value) => onUpdateShowGrid(value)} />
    </Toolbar>
  )
}

export default VersionsToolbar
