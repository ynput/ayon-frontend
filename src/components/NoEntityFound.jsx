import clsx from 'clsx'
import { EmptyPlaceholder } from '@shared/components'
import { getEntityTypeIcon } from '@shared/util'

// the empty state of the narrow entity columns (tasks, workfiles);
// muted when it asks for a selection that can't be made yet
const NoEntityFound = ({ type = 'task', icon, label, muted }) => (
  <EmptyPlaceholder
    className={clsx('compact', { muted })}
    icon={icon || getEntityTypeIcon(type)}
    message={label || `No ${type}s found`}
  />
)

export default NoEntityFound
