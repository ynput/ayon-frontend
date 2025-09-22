import { SelectionData, SliceType } from '@shared/containers'
import { RemoteAddonProjectProps } from '@shared/context'
import { FC } from 'react'

type Slicer = {
  selection: SelectionData
  type: SliceType
  persistentRowSelectionData: SelectionData
  setPersistentRowSelectionData: (data: SelectionData) => void
}
interface ReportsFallbackProps extends RemoteAddonProjectProps {
  slicer: Slicer
}

const ReportsFallback: FC<ReportsFallbackProps> = ({}) => {
  return <div>Install reports and insights addon!</div>
}

export default ReportsFallback
