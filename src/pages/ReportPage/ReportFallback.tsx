import { SelectionData, SliceType } from '@shared/containers'
import { RemoteAddonProjectProps } from '@shared/context'
import { FC } from 'react'

type Slicer = {
  selection: SelectionData
  type: SliceType
  persistentRowSelectionData: SelectionData
  setPersistentRowSelectionData: (data: SelectionData) => void
}
interface ReportFallbackProps extends RemoteAddonProjectProps {
  slicer: Slicer
}

const ReportFallback: FC<ReportFallbackProps> = ({}) => {
  return <div>Install reports and insights now!</div>
}

export default ReportFallback
