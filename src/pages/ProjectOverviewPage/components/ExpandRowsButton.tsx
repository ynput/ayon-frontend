import { FC } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { useTaskColumnsContext } from '@shared/containers/ProjectTreeTable'
import Shortcuts from '@containers/Shortcuts'

// Makes every folder row tall, so the task columns show thumbnails. Only there while a task
// column is shown.
const ExpandRowsButton: FC = () => {
  const taskColumns = useTaskColumnsContext()
  if (!taskColumns?.isActive) return null
  const { isAllExpanded, toggleAllExpanded } = taskColumns

  return (
    <>
      {/* @ts-ignore */}
      <Shortcuts shortcuts={[{ key: 'E', action: toggleAllExpanded }]} deps={[toggleAllExpanded]} />
      <Button
        icon={isAllExpanded ? 'unfold_less' : 'unfold_more'}
        selected={isAllExpanded}
        onClick={toggleAllExpanded}
        data-tooltip={isAllExpanded ? 'Collapse all rows' : 'Expand all rows'}
        data-shortcut="Shift+E"
      />
    </>
  )
}

export default ExpandRowsButton
