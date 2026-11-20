import { FC, ReactNode } from 'react'
import { TaskColumnsProvider, useProjectTableContext } from '@shared/containers/ProjectTreeTable'
import { useOverviewViewSettings, useViewsContext, useViewUpdateHelper } from '@shared/containers'
import { useProjectOverviewContext } from '../context/project-overview'

// The Overview's task columns: fed by the rows on screen, "expand all rows" saved in the view.
const OverviewTaskColumnsProvider: FC<{ children: ReactNode; disabled?: boolean }> = ({
  children,
  disabled,
}) => {
  const { visibleEntityIds } = useProjectOverviewContext()
  const { showHierarchy, isFlatFolderView } = useProjectTableContext()
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const { expandRows, onUpdateExpandRows } = useOverviewViewSettings({
    viewSettings,
    updateViewSettings,
  })

  return (
    <TaskColumnsProvider
      visibleEntityIds={visibleEntityIds}
      // the flat task list and group-by modes show tasks as rows
      enabled={!disabled && (showHierarchy || !!isFlatFolderView)}
      isAllExpanded={expandRows}
      onAllExpandedChange={onUpdateExpandRows}
    >
      {children}
    </TaskColumnsProvider>
  )
}

export default OverviewTaskColumnsProvider
