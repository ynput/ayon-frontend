import { useCallback, useState } from 'react'
import type { LinkTypeModel } from '@shared/api'
import type { EntityScope } from '../types/table'
import { getLinkColumnId } from '../buildTreeTableColumns'
import { getScopedColumnId } from '../utils/cellUtils'

type LinkTypes = Pick<LinkTypeModel, 'name' | 'inputType' | 'outputType'>[]

const NO_LINK_TYPES: LinkTypes = []

export const useLinkColumnsVisibility = (linkTypes: LinkTypes = NO_LINK_TYPES) => {
  const [onScreen, setOnScreen] = useState<Record<string, boolean>>({})

  // the table reports only the columns whose on-screen state changed
  const onLinkColumnsVisibleChange = useCallback(
    (changes: Record<string, boolean>) => setOnScreen((prev) => ({ ...prev, ...changes })),
    [],
  )

  const isLinkColumnShown = useCallback(
    (scope: EntityScope, entityType: string) => {
      const isOnScreen = (link: Pick<LinkTypeModel, 'name'>, direction: 'in' | 'out') =>
        !!onScreen[getScopedColumnId(scope, getLinkColumnId(link, direction))]
      // `out` columns belong to the input entity, `in` columns to the output entity
      return linkTypes.some(
        (link) =>
          (link.inputType === entityType && isOnScreen(link, 'out')) ||
          (link.outputType === entityType && isOnScreen(link, 'in')),
      )
    },
    [linkTypes, onScreen],
  )

  return { onLinkColumnsVisibleChange, isLinkColumnShown }
}
