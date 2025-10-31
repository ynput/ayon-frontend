import { SelectionData, SliceType } from '@shared/containers'
import { RemoteAddonProjectProps } from '@shared/context'
import { ViewsContextValue } from '@shared/containers/Views'
import { FC } from 'react'

type Slicer = {
  selection: SelectionData
  type: SliceType
  persistentRowSelectionData: SelectionData
  setPersistentRowSelectionData: (data: SelectionData) => void
}

type ViewData = {
  widgets?: any[]
  dateFormat?: string
}

type ViewsWithReportsSettings = ViewsContextValue & {
  onUpdateWidgets: (viewData: ViewData) => void
  onUpdateDateFormat: (viewData: ViewData) => void
}

interface ReportsFallbackProps extends RemoteAddonProjectProps {
  slicer: Slicer
  views: ViewsWithReportsSettings
}

const ReportsFallback: FC<ReportsFallbackProps> = ({}) => {
  return <div>Install reports and insights addon!</div>
}

export default ReportsFallback
