import { useEffect, useMemo, useState } from 'react'
import type { AttributeModel } from '@shared/api'
import { usePowerpack, useProjectFoldersContext } from '@shared/context'
import { getSearchMatchedFolderIds } from '@shared/util'
import { useSlicerContext } from '../context/slicer'
import { createFiltersFromSlicer } from '../util/createFilterFromSlicer'
import type { SliceFilter } from '../types'
import type { SliceRowSelection } from '@shared/containers/ProjectTreeTable/hooks/useSelectedFolders'

export interface SlicerPanelSelections {
  sliceSelections: SliceRowSelection[]
  sliceFilters: SliceFilter[]
  // top-most folders the hierarchy panel search matches, null without a search
  searchFolderIds: string[] | null
  // panels 2+ are license-gated; pages hold their first fetch until the license resolves
  isLicensePending: boolean
}

export const useSlicerPanelSelections = (attribFields: AttributeModel[]): SlicerPanelSelections => {
  const { slices, getPanelSelection, searchByPanel } = useSlicerContext()
  const { folders } = useProjectFoldersContext()
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

  // only the hierarchy search narrows the table, the value panels' searches just find a
  // value to click. Same license rule as the selections: only a rendered panel counts.
  const hierarchySearch = sliceSelections.some((slice) => slice.sliceType === 'hierarchy')
    ? searchByPanel.hierarchy
    : undefined
  // every key stroke would refetch the table
  const [debouncedSearch, setDebouncedSearch] = useState(hierarchySearch)
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(hierarchySearch), 300)
    return () => clearTimeout(timeout)
  }, [hierarchySearch])

  const searchFolderIds = useMemo(
    // folders still loading: no restriction yet rather than an empty table
    () =>
      debouncedSearch && folders.length
        ? getSearchMatchedFolderIds(folders, debouncedSearch)
        : null,
    [folders, debouncedSearch],
  )

  return {
    sliceSelections,
    sliceFilters,
    searchFolderIds,
    isLicensePending: slices.length > 1 && isLoadingPowerLicense,
  }
}
