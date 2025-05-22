import { SelectionData, SliceType } from '@shared/containers'
import { RemoteAddonProjectProps } from '@shared/context'
import { FC } from 'react'

type Slicer = {
  selection: SelectionData
  type: SliceType
  persistentRowSelectionData: SelectionData
}
interface SchedulerFallbackProps extends RemoteAddonProjectProps {
  slicer: Slicer
}

const SchedulerFallback: FC<SchedulerFallbackProps> = ({}) => {
  return <div>Install scheduler now!</div>
}

export default SchedulerFallback
