import React, { createContext, useContext, ReactNode, useMemo, useCallback, ChangeEvent } from 'react'
import { useLocalStorage } from '@shared/hooks'
import type { Addon } from './types'
import { matchSorter } from 'match-sorter'

type AddonSearchContextType = {
  search: string
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
  filteredAddons: Addon[]
  addons: Addon[]
  resetSearch: () => void
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
    return matchSorter(addons, search, { keys: ['name', 'title'] })
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
      addons,
      resetSearch,
    }),
    [search, onSearchChange, filteredAddons, addons, resetSearch],
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
