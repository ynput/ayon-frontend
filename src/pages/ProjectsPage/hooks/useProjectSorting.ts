import { useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import { convertColumnConfigToTanstackStates, serializeViewSorting } from '@shared/util'
import type { OverviewSettings } from '@shared/api/generated/views'
import { SortingState } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'

export const useProjectSorting = () => {
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const [localSorting, setLocalSorting] = useState<SortingState | null>(null)

  const storedSorting = useMemo<SortingState | undefined>(() => {
    const settings = viewSettings as OverviewSettings | undefined
    if (!settings) return undefined
    const config = convertColumnConfigToTanstackStates(settings)
    return config.sorting?.length ? config.sorting : undefined
  }, [viewSettings])

  const sorting: SortingState = localSorting ?? storedSorting ?? []

  const handleSortingChange = useCallback(
    async (newSorting: SortingState) => {
      await updateViewSettings(
        { sortBy: serializeViewSorting(newSorting), sortDesc: undefined },
        setLocalSorting,
        newSorting,
        {},
      )
    },
    [updateViewSettings],
  )

  return { sorting, handleSortingChange }
}
