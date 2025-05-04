import { SelectionData, SliceType } from '@shared/Slicer'
import { FC } from 'react'

type Slicer = {
  selection: SelectionData
  type: SliceType
  persistentRowSelectionData: SelectionData
}
interface SchedulerFallbackProps {
  projectName: string
  slicer: Slicer
}

const SchedulerFallback: FC<SchedulerFallbackProps> = ({}) => {
  return <div>Install scheduler now!</div>
}

export default SchedulerFallback
