import { Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { ShowProductsSwitch } from './ShowProductsSwitch'
import VersionsSearchFilter from './VersionsSearchFilter'
import { CustomizeButton, TableGridSwitch } from '@shared/components'
import { useVersionsViewsContext } from '@pages/VersionsPage/context/VersionsViewsContext'

interface VersionsToolbarProps {}

const VersionsToolbar: FC<VersionsToolbarProps> = ({}) => {
  const { showGrid, onUpdateShowGrid } = useVersionsViewsContext()

  return (
    <Toolbar>
      <VersionsSearchFilter />
      <ShowProductsSwitch />
      <TableGridSwitch showGrid={showGrid} onChange={(value) => onUpdateShowGrid(value)} />
      <CustomizeButton />
    </Toolbar>
  )
}

export default VersionsToolbar
