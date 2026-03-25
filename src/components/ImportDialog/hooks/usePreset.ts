import { useViewsContext, useViewUpdateHelper } from "@shared/containers"
import { ColumnMappings, ValueMappings } from "../steps/common"
import { useMemo } from "react"
import { cloneDeep, merge } from "lodash"

type MappingsPreset = {
  columns?: ColumnMappings
  values?: ValueMappings
}

export default function usePreset() {
  const { viewSettings, isViewWorking } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()

  // ensure we only update the preset if the selected view changes
  const current: MappingsPreset = useMemo(() => {
    if (!viewSettings || isViewWorking) return {}
    return (viewSettings as any).preset ?? {}
  }, [viewSettings, isViewWorking])

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
    updateValues: (values: ValueMappings) => {
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
  }
}
