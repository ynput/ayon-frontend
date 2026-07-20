import { newEntityDefinitions, useNewEntityContext } from '@shared/containers/NewEntity'
import { SimpleTableRowContextMenuBuilder } from '@shared/containers/SimpleTable'
import { useMemo } from 'react'

export const useHierarchyContextMenuItems = () => {
  const { onOpenNew } = useNewEntityContext()

  const rowContextMenuBuilders = useMemo<SimpleTableRowContextMenuBuilder[]>(
    () => [
      () => {
        return {
          label: newEntityDefinitions.folder.createLabel,
          icon: newEntityDefinitions.folder.icon,
          command: () => onOpenNew?.('folder'),
        }
      },
      () => {
        return {
          label: newEntityDefinitions.task.createLabel,
          icon: newEntityDefinitions.task.icon,
          command: () => onOpenNew?.('task'),
        }
      },
    ],
    [onOpenNew],
  )

  return rowContextMenuBuilders
}
