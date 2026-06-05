import { useViewsContext, useViewUpdateHelper } from "@shared/containers"
import { ColumnMappings, ValueMappings } from "../steps/common"
import { useCallback, useMemo } from "react"
import { cloneDeep, debounce, merge } from "lodash"

type MappingsPreset = {
  columns?: ColumnMappings
  values?: ValueMappings
}

const UPDATE_DEBOUNCE_DELAY_MS = 1_000

export default function usePreset() {
  const { viewSettings, isViewWorking } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()

  // ensure we only update the preset if the selected view changes
  const current: MappingsPreset = useMemo(() => {
    if (!viewSettings || isViewWorking) return {}
    return (viewSettings as any).preset ?? {}
  }, [viewSettings, isViewWorking])

  const updateValues = useCallback(debounce(
    (values: ValueMappings) => {
      const settings = merge(
        cloneDeep(viewSettings),
        {
          preset: {
            ...(values ? { values } : {}),
          },
        },
      )

      return updateViewSettings(settings, () => {}, settings, {})
    },
    UPDATE_DEBOUNCE_DELAY_MS,
  ), [viewSettings])

  return {
    current,
    updateColumns: (columns: ColumnMappings) => {
      const settings = merge(
        cloneDeep(viewSettings),
        {
          preset: {
            ...(columns ? { columns } : {}),
          },
        },
      )

      return updateViewSettings(settings, () => {}, settings, {})
    },
    updateValues,
  }
}
