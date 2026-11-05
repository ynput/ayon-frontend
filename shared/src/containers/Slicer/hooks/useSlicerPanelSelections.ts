import { useEffect, useMemo, useState } from 'react'
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
  // A search acts as selecting every row it leaves. Lists resolve their selection to
  // entities, so their search narrows the selection itself.
  const { sliceSelections, searchFilterSlices, hasEmptySearch } = useMemo(() => {
    const visible = powerLicense ? slices : slices.slice(0, 1)
    let hasEmptySearch = false
    const searchFilterSlices: SliceRowSelection[] = []
    const sliceSelections = visible.map((slice) => {
      const rowSelection = getPanelSelection(slice.id)
      const matches = slice.sliceType === 'hierarchy' ? undefined : debouncedMatches[slice.id]
      if (!matches) return { sliceType: slice.sliceType, rowSelection }
      if (slice.sliceType === 'entityList') {
        const searched = applySearchMatches(rowSelection, matches)
        if (!searched) hasEmptySearch = true
        return { sliceType: slice.sliceType, rowSelection: searched ?? {} }
      }
      if (!matches.length) hasEmptySearch = true
      else
        searchFilterSlices.push({
          sliceType: slice.sliceType,
          rowSelection: Object.fromEntries(matches.map((id) => [id, true])),
        })
      return { sliceType: slice.sliceType, rowSelection }
    })
    return { sliceSelections, searchFilterSlices, hasEmptySearch }
  }, [slices, getPanelSelection, powerLicense, debouncedMatches])

  // a value panel's search is a second filter of that panel, ANDed with its selection: a
  // selection inside the results narrows them, one the search hides leaves nothing. It
  // keeps the panel's id, so the panel's own counts still leave it out.
  const sliceFilters = useMemo(
    () =>
      createFiltersFromSlicer({
        slices: [...sliceSelections, ...searchFilterSlices],
        attribFields,
      }),
    [sliceSelections, searchFilterSlices, attribFields],
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

  const searchFolderIds = useMemo(() => {
    // a search that leaves no rows has no filter value to express it: an empty folder match
    // is the restriction every page already turns into no rows
    if (hasEmptySearch) return []
    // folders still loading: no restriction yet rather than an empty table
    return debouncedSearch && folders.length
      ? getSearchMatchedFolderIds(folders, debouncedSearch)
      : null
  }, [folders, debouncedSearch, hasEmptySearch])

  return {
    sliceSelections,
    sliceFilters,
    searchFolderIds,
    isLicensePending: slices.length > 1 && isLoadingPowerLicense,
  }
}
