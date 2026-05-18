import { useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import {
  convertColumnConfigToTanstackStates,
  convertTanstackStatesToColumnConfig,
} from '@shared/util'
import type { OverviewSettings } from '@shared/api/generated/views'
import { ColumnOrderState } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { ProjectColumn } from './useProjectColumns'

type Props = {
  columns: ProjectColumn[]
}

export const useProjectColumnOrder = ({ columns }: Props) => {
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const [localColumnOrder, setLocalColumnOrder] = useState<ColumnOrderState | null>(null)

  const storedColumnOrder = useMemo<ColumnOrderState | undefined>(() => {
    const settings = viewSettings as OverviewSettings | undefined
    if (!settings?.columns?.length) return undefined
    const config = convertColumnConfigToTanstackStates(settings)
    return config.columnOrder.length > 0 ? config.columnOrder : undefined
  }, [viewSettings])

  const columnOrder = localColumnOrder ?? storedColumnOrder

  const handleColumnOrderChange = useCallback(
    async (newOrder: ColumnOrderState) => {
      const allColumnIds = columns.map((c) => c.id as string)
      const columnConfig = convertTanstackStatesToColumnConfig(
        {
          columnOrder: newOrder,
          columnVisibility: {},
          columnPinning: {},
          columnSizing: {},
        },
        allColumnIds,
      )
      await updateViewSettings({ columns: columnConfig.columns }, setLocalColumnOrder, newOrder, {})
    },
    [columns, updateViewSettings],
  )

  return { columnOrder, handleColumnOrderChange }
}
