import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AttributeModel } from '@shared/api'
import { usePowerpack, useProjectFoldersContext } from '@shared/context'
import { getSearchMatchedFolderIds } from '@shared/util'
import { useSlicerContext } from '../context/slicer'
import { createFiltersFromSlicer } from '../util/createFilterFromSlicer'
import { applySearchMatches } from '../util/applySearchMatches'
import type { SliceFilter } from '../types'
import type { SliceRowSelection } from '@shared/containers/ProjectTreeTable/hooks/useSelectedFolders'

export interface SlicerPanelSelections {
  sliceSelections: SliceRowSelection[]
  sliceFilters: SliceFilter[]
  // top-most folders the hierarchy panel search matches, null without a search, empty when a
  // search (hierarchy or value panel) leaves nothing
  searchFolderIds: string[] | null
  // searchFolderIds for a panel's counts query: without that panel's own empty search
  getCountsSearchFolderIds: (sliceType: string) => string[] | null
  // panels 2+ are license-gated; pages hold their first fetch until the license resolves
  isLicensePending: boolean
}

export const useSlicerPanelSelections = (attribFields: AttributeModel[]): SlicerPanelSelections => {
  const { slices, getPanelSelection, searchByPanel, searchMatchesByPanel } = useSlicerContext()
  const { folders } = useProjectFoldersContext()
  const { powerLicense, isLoading: isLoadingPowerLicense } = usePowerpack()

  // every key stroke would refetch the table
  const [debouncedMatches, setDebouncedMatches] = useState(searchMatchesByPanel)
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedMatches(searchMatchesByPanel), 300)
    return () => clearTimeout(timeout)
  }, [searchMatchesByPanel])

  // without a license only the first panel renders, so only it may contribute.
  // A search acts as selecting every row it leaves; a selection inside the results
  // narrows them and one the search hides leaves nothing.
  const { sliceSelections, emptySearchSliceTypes } = useMemo(() => {
    const visible = powerLicense ? slices : slices.slice(0, 1)
    const emptySearchSliceTypes: string[] = []
    const sliceSelections = visible.map((slice) => {
      const rowSelection = getPanelSelection(slice.id)
      const matches = slice.sliceType === 'hierarchy' ? undefined : debouncedMatches[slice.id]
      if (!matches) return { sliceType: slice.sliceType, rowSelection }
      const searched = applySearchMatches(rowSelection, matches)
      if (!searched) emptySearchSliceTypes.push(slice.sliceType)
      return { sliceType: slice.sliceType, rowSelection: searched ?? {} }
    })
    return { sliceSelections, emptySearchSliceTypes }
  }, [slices, getPanelSelection, powerLicense, debouncedMatches])

  const sliceFilters = useMemo(
    () => createFiltersFromSlicer({ slices: sliceSelections, attribFields }),
    [sliceSelections, attribFields],
  )

  // the hierarchy search matches against every folder, not only the rows the panel has
  // loaded. Same license rule as the selections: only a rendered panel counts.
  const hierarchySearch = sliceSelections.some((slice) => slice.sliceType === 'hierarchy')
    ? searchByPanel.hierarchy
    : undefined
  const [debouncedSearch, setDebouncedSearch] = useState(hierarchySearch)
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(hierarchySearch), 300)
    return () => clearTimeout(timeout)
  }, [hierarchySearch])

  const hierarchySearchFolderIds = useMemo(
    // folders still loading: no restriction yet rather than an empty table
    () =>
      debouncedSearch && folders.length
        ? getSearchMatchedFolderIds(folders, debouncedSearch)
        : null,
    [folders, debouncedSearch],
  )

  // a value search that leaves nothing has no filter value to express it: an empty folder
  // match is the restriction every page already turns into no rows
  const hasEmptySearch = emptySearchSliceTypes.length > 0
  const searchFolderIds = useMemo(
    () => (hasEmptySearch ? [] : hierarchySearchFolderIds),
    [hasEmptySearch, hierarchySearchFolderIds],
  )

  // a panel's counts leave its own filter out, and so its own empty search too
  const getCountsSearchFolderIds = useCallback(
    (sliceType: string) =>
      emptySearchSliceTypes.length === 1 && emptySearchSliceTypes[0] === sliceType
        ? hierarchySearchFolderIds
        : searchFolderIds,
    [emptySearchSliceTypes, hierarchySearchFolderIds, searchFolderIds],
  )

  return {
    sliceSelections,
    sliceFilters,
    searchFolderIds,
    getCountsSearchFolderIds,
    isLicensePending: slices.length > 1 && isLoadingPowerLicense,
  }
}
