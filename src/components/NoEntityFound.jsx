import { EmptyPlaceholder } from '@shared/components'
import { getEntityTypeIcon } from '@shared/util'

// the empty state of the narrow entity columns (tasks, workfiles)
const NoEntityFound = ({ type = 'task', icon, label }) => (
  <EmptyPlaceholder
    className="compact"
    icon={icon || getEntityTypeIcon(type)}
    message={label || `No ${type}s found`}
  />
)

export default NoEntityFound
