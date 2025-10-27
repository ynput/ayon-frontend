import { useCallback, useEffect, useRef, ChangeEvent, useState } from 'react'
import { useLocalStorage } from '@shared/hooks'
import type { Addon } from './types'

/**
 * Custom hook for addon search functionality
 * Manages search state, filtering, and persistence to localStorage
 */
export const useAddonSearch = (
  addons: Addon[],
) => {
  const [search, setSearch] = useLocalStorage('bundles-search', '')
  const [filteredAddons, setFilteredAddons] = useState (addons)
  const hasAppliedInitialFilter = useRef(false)

  const filterAddons = useCallback(
    (searchValue: string) => {
      if (!searchValue.trim()) {
        return // Don't modify selection on empty search
      }

      const lowerSearch = searchValue.toLowerCase()
      const filtered = addons.filter(
        (addon) =>
          addon.name.toLowerCase().includes(lowerSearch) ||
          addon.title?.toLowerCase().includes(lowerSearch),
      )
      setFilteredAddons(filtered)
    },
    [addons],
  )

  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearch(value)

      if (value.trim()) {
        filterAddons(value)
      } else {
        setFilteredAddons(addons)
      }
    },
    [setSearch, filterAddons],
  )

  useEffect(() => {
    if (!hasAppliedInitialFilter.current && addons?.length && search?.trim()) {
      filterAddons(search)
      hasAppliedInitialFilter.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addons])

  return {
    search,
    onSearchChange,
    filteredAddons
  }
}
