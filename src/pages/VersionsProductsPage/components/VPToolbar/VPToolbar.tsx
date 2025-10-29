import { Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { ShowProductsSwitch } from './ShowProductsSwitch'
import VPSearchFilter from './VPSearchFilter'
import { CustomizeButton, TableGridSwitch } from '@shared/components'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'

interface VPToolbarProps {}

const VPToolbar: FC<VPToolbarProps> = ({}) => {
  const { showGrid, onUpdateShowGrid } = useVPViewsContext()

  return (
    <Toolbar>
      <VPSearchFilter />
      <ShowProductsSwitch />
      <TableGridSwitch showGrid={showGrid} onChange={(value) => onUpdateShowGrid(value)} />
      <CustomizeButton />
    </Toolbar>
  )
}

export default VPToolbar
