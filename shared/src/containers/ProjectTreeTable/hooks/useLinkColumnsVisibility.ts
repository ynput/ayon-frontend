import { useCallback, useState } from 'react'
import type { LinkTypeModel } from '@shared/api'
import type { EntityScope } from '../types/table'
import { getLinkColumnId } from '../buildTreeTableColumns'
import { getScopedColumnId } from '../utils/cellUtils'

// Tracks which link columns are on screen, fed by ProjectTreeTable's onColumnVisibleChange.
export const useLinkColumnsVisibility = (
  linkTypes: Pick<LinkTypeModel, 'name' | 'inputType' | 'outputType'>[] = [],
) => {
  const [onScreen, setOnScreen] = useState<Record<string, boolean>>({})

  // the table reports only the columns whose on-screen state changed
  const onLinkColumnsVisibleChange = useCallback(
    (changes: Record<string, boolean>) => setOnScreen((prev) => ({ ...prev, ...changes })),
    [],
  )

  // true when a link column of `scope` using a link type of `entityType` is on screen
  const isLinkColumnShown = useCallback(
    (scope: EntityScope, entityType: string) =>
      linkTypes
        .filter((link) => link.inputType === entityType || link.outputType === entityType)
        .some((link) =>
          (['in', 'out'] as const).some(
            (direction) => onScreen[getScopedColumnId(scope, getLinkColumnId(link, direction))],
          ),
        ),
    [linkTypes, onScreen],
  )

  return { onLinkColumnsVisibleChange, isLinkColumnShown }
}
