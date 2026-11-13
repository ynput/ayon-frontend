import { useCallback, useEffect, useState } from 'react'
import type { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { UpdateViewSettingsFn } from '../../utils/viewUpdateHelper'

// `filter` saves the search bar's filter in the same update, for filters moved from the search
// bar into the advanced filter (two updates at once can reach the server in either order)
export type UpdateAdvancedFilter = (
  advancedFilter: QueryFilter | undefined,
  filter?: QueryFilter,
) => void

export type AdvancedFilterSetting = {
  // undefined when there are no conditions
  advancedFilter: QueryFilter | undefined
  onUpdateAdvancedFilter: UpdateAdvancedFilter
}

// The `advancedFilter` view setting, saved the same way as the page's `filter`
export const useAdvancedFilterSetting = (
  viewSettings: unknown,
  updateViewSettings: UpdateViewSettingsFn,
): AdvancedFilterSetting => {
  // {} while a removal is being saved: null hands the value back to the server settings
  const [localFilter, setLocalFilter] = useState<QueryFilter | null>(null)

  const serverFilter = (viewSettings as { advancedFilter?: QueryFilter } | undefined)
    ?.advancedFilter
  useEffect(() => {
    setLocalFilter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(serverFilter)])

  const filter = localFilter !== null ? localFilter : serverFilter
  const advancedFilter = filter?.conditions?.length ? filter : undefined

  const onUpdateAdvancedFilter = useCallback(
    async (newFilter: QueryFilter | undefined, filter?: QueryFilter) => {
      const value = newFilter?.conditions?.length ? newFilter : undefined
      const settings = filter ? { advancedFilter: value, filter } : { advancedFilter: value }
      await updateViewSettings(settings, setLocalFilter, value ?? {}, {
        errorMessage: 'Failed to update filter settings',
      })
    },
    [updateViewSettings],
  )

  return { advancedFilter, onUpdateAdvancedFilter }
}
