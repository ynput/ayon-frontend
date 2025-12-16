import { SlicerContextValue } from '@shared/containers/Slicer'
import { RemoteAddonProjectProps } from '@shared/context'
import { FC } from 'react'

interface ReportsFallbackProps extends RemoteAddonProjectProps {
  state?: { slicer?: SlicerContextValue }
}

const ReportsFallback: FC<ReportsFallbackProps> = ({}) => {
  return <div>Install reports and insights addon!</div>
}

export default ReportsFallback
