import { SelectionData, SliceType } from '@shared/containers'
import { RemoteAddonProjectProps } from '@shared/context'
import { UpdateViewSettingsFn, ViewsContextValue } from '@shared/containers/Views'
import { FC } from 'react'
import { ReportsSettings } from '@shared/api'

type Slicer = {
  selection: SelectionData
  type: SliceType
  persistentRowSelectionData: SelectionData
  setPersistentRowSelectionData: (data: SelectionData) => void
}

type ViewsWithReportsSettings = ViewsContextValue & {
  settings: ReportsSettings
  updateViewSettings: UpdateViewSettingsFn
}

interface ReportsFallbackProps extends RemoteAddonProjectProps {
  slicer: Slicer
  views: ViewsWithReportsSettings
}

const ReportsFallback: FC<ReportsFallbackProps> = ({}) => {
  return <div>Install reports and insights addon!</div>
}

export default ReportsFallback
