import { useMemo } from 'react'
import type { AttributeModel } from '@shared/api'
import { usePowerpack } from '@shared/context/PowerpackContext'
import { useSlicerContext } from '../context/SlicerContext'
import { createFiltersFromSlicer } from '../util/createFilterFromSlicer'
import type { SliceFilter } from '../types'
import type { SliceRowSelection } from '@shared/containers/ProjectTreeTable/hooks/useSelectedFolders'

export interface SlicerPanelSelections {
  sliceSelections: SliceRowSelection[]
  sliceFilters: SliceFilter[]
  // panels 2+ are license-gated; pages hold their first fetch until the license resolves
  isLicensePending: boolean
}

export const useSlicerPanelSelections = (
  attribFields: AttributeModel[],
): SlicerPanelSelections => {
  const { slices, getPanelSelection } = useSlicerContext()
  const { powerLicense, isLoading: isLoadingPowerLicense } = usePowerpack()

  // without a license only the first panel renders, so only it may contribute
  const sliceSelections = useMemo(() => {
    const all = slices.map((slice) => ({
      sliceType: slice.sliceType,
      rowSelection: getPanelSelection(slice.id),
    }))
    return powerLicense ? all : all.slice(0, 1)
  }, [slices, getPanelSelection, powerLicense])

  const sliceFilters = useMemo(
    () => createFiltersFromSlicer({ slices: sliceSelections, attribFields }),
    [sliceSelections, attribFields],
  )

  return {
    sliceSelections,
    sliceFilters,
    isLicensePending: slices.length > 1 && isLoadingPowerLicense,
  }
}
