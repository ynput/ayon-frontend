// @ts-ignore
import sh from 'searchhash'

import SearchDropdown, { type Suggestion } from '@components/SearchDropdown/SearchDropdown'
import { Button, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { useCallback, useEffect, useRef } from 'react'
import { $Any } from '@types'
import { generateResultsAndFilterIds } from './searchTools'
import { SettingsOutlineToggle } from '@containers/SettingsEditor/SettingsOutline'

const NO_SUGGESTIONS: Suggestion[] = []

// Searching re-renders every form, so it waits until typing pauses
const SEARCH_DELAY = 250

type AddonData = {
  name: string
  version: string
  variant: string
  title: string
  settings: $Any
}
type Props = {
  showHelp: boolean
  addonsData: AddonData[]
  searchTreeData: $Any
  addonSchemas: $Any
  setShowHelp: (value: boolean) => void
  searchCallback: (searchText?: string, filterKeys?: { [key: string]: string[] }) => void
}

const SettingsListHeader = ({
  addonsData,
  searchTreeData,
  addonSchemas,
  showHelp,
  setShowHelp,
  searchCallback,
}: Props) => {
  const search = useRef('')
  const pending = useRef<ReturnType<typeof setTimeout>>()
  // the last search sent, so a submit of the same text doesn't re-render the forms again
  const applied = useRef<{ text: string; build?: unknown }>({ text: '' })

  const buildFilterKeys = useCallback(
    (searchText: string) => {
      if (searchText === '') return {}

      const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regexp = RegExp(escapedSearch, 'i')
      return addonsData.reduce<Record<string, string[]>>((results, addon) => {
        if (addonSchemas?.[addon.name] === undefined) return results

        const hydratedObject = searchTreeData[addon.name] || {}
        const keyResults = sh.forValue(hydratedObject, regexp)
        results[addon.name] = generateResultsAndFilterIds(keyResults)
        return results
      }, {})
    },
    [addonsData, addonSchemas, searchTreeData],
  )
  const applySearch = useCallback(
    (text: string) => {
      clearTimeout(pending.current)
      if (applied.current.text === text && applied.current.build === buildFilterKeys) return
      applied.current = { text, build: buildFilterKeys }
      searchCallback(text, buildFilterKeys(text))
    },
    [buildFilterKeys, searchCallback],
  )

  const handleFilter = useCallback(
    (newSearch: string) => {
      search.current = newSearch
      clearTimeout(pending.current)
      if (newSearch) pending.current = setTimeout(() => applySearch(newSearch), SEARCH_DELAY)
      return []
    },
    [applySearch],
  )

  // a search stays applied while addons are added or their schemas load: their keys are matched too
  useEffect(() => {
    if (applied.current.text) applySearch(applied.current.text)
  }, [applySearch])

  useEffect(() => () => clearTimeout(pending.current), [])

  if (addonsData.length === 0) return null

  return (
    <Toolbar>
      <SearchDropdown
        placeholder="Search and filter settings"
        suggestions={NO_SUGGESTIONS}
        suggestionsLimit={10}
        isLoading={false}
        hideSuggestions={true}
        onSubmit={() => applySearch(search.current)}
        onClear={() => {
          clearTimeout(pending.current)
          search.current = ''
          applied.current = { text: '' }
          searchCallback()
        }}
        onFocus={() => {}}
        onClose={() => {}}
        filter={handleFilter}
      />

      <Spacer />

      <SettingsOutlineToggle />
      <Button
        onClick={() => {
          setShowHelp(!showHelp)
        }}
        icon="help"
        data-tooltip="Show help descriptions"
        selected={showHelp}
      />
    </Toolbar>
  )
}

export default SettingsListHeader
