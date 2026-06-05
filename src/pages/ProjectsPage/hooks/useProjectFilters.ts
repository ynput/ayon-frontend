import { useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import type { OverviewSettings } from '@shared/api/generated/views'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { useCallback, useMemo, useState } from 'react'

export const useProjectFilters = () => {
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const [localFilters, setLocalFilters] = useState<QueryFilter | null>(null)

  const storedFilters = useMemo<QueryFilter>(() => {
    const settings = viewSettings as OverviewSettings | undefined
    return (settings?.filter as QueryFilter) ?? {}
  }, [viewSettings])

  const filters: QueryFilter = localFilters ?? storedFilters

  const handleFiltersChange = useCallback(
    async (newFilters: QueryFilter) => {
      await updateViewSettings({ filter: newFilters as any }, setLocalFilters, newFilters, {})
    },
    [updateViewSettings],
  )

  return { filters, handleFiltersChange }
}
