import { EmptyWidget } from './EmptyWidget'
import { ErrorWidget } from './ErrorWidget'

type MetaWidgetProps = {
  metaType?: 'empty' | 'error'
  label: string
}

/**
 * Meta widget container that switches between different meta widgets based on metaType
 * Displays appropriate widget for empty or error states
 */
export const MetaWidget = ({ metaType, label }: MetaWidgetProps) => {
  switch (metaType) {
    case 'empty':
      return <EmptyWidget label={label} />
    case 'error':
      return <ErrorWidget label={label} />
    default:
      return null
  }
}
