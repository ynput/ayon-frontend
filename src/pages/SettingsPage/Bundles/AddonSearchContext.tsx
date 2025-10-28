import React, { createContext, useContext, ReactNode, useMemo, useCallback, ChangeEvent } from 'react'
import { useLocalStorage } from '@shared/hooks'
import type { Addon } from './types'

type AddonSearchContextType = {
  search: string
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
  filteredAddons: Addon[]
  resetSearch: () => void
  totalAddonsCount: number
}

const AddonSearchContext = createContext<AddonSearchContextType | undefined>(undefined)

interface AddonSearchProviderProps {
  addons: Addon[]
  children: ReactNode
}

export const AddonSearchProvider: React.FC<AddonSearchProviderProps> = ({ addons, children }) => {
  const [search, setSearch] = useLocalStorage('bundles-search', '')

  const filteredAddons = useMemo(() => {
    if (!search) return addons
    const searchLower = search.toLowerCase()
    return addons.filter(
      (addon) =>
        addon.name.toLowerCase().includes(searchLower) ||
        addon.title?.toLowerCase().includes(searchLower),
    )
  }, [addons, search])

  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearch(value)
    },
    [setSearch],
  )

  const resetSearch = useCallback(() => {
    setSearch('')
  }, [setSearch])

  const value = useMemo(
    () => ({
      search,
      onSearchChange,
      filteredAddons,
      resetSearch,
      totalAddonsCount: addons.length,
    }),
    [search, onSearchChange, filteredAddons, resetSearch, addons.length],
  )

  return (
    <AddonSearchContext.Provider value={value}>
      {children}
    </AddonSearchContext.Provider>
  )
}

export const useAddonSearchContext = () => {
  const context = useContext(AddonSearchContext)
  if (context === undefined) {
    throw new Error('useAddonSearchContext must be used within an AddonSearchProvider')
  }
  return context
}
