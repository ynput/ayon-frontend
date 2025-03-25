// @ts-ignore
import sh from 'searchhash';

import SearchDropdown from '@components/SearchDropdown/SearchDropdown'
import { Button, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { useEffect, useState } from 'react';
import { $Any } from '@types';
import { generateResultsAndFilterIds } from './searchTools';

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
  searchTreeData: $Any,
  addonSchemas: $Any
  setShowHelp: (value: boolean) => void
  searchCallback: (searchText?: string, filterKeys?: {[key: string]: string[]}) => void
}

const SettingsListHeader = ({
  addonsData,
  searchTreeData,
  addonSchemas,
  showHelp,
  setShowHelp,
  searchCallback,
}: Props) => {
  if (addonsData.length === 0) {
    return null
  }

  const [search, setSearch] = useState<string>('')
  const [filterKeys, setFilterKeys] = useState<{[key: string]: string[]}>({})
  useEffect(() => {
    filter()
  }, [addonsData, addonSchemas])

  useEffect(() => {
    searchCallback(search, filterKeys)
  }, [filterKeys])

  useEffect(() => {
  }, [filterKeys])

  const filter = () => {
    if (search === '') {
      setFilterKeys({})
      return []
    }

    const regexp = RegExp(search, 'i')

    setFilterKeys({})
    for (const addon of addonsData) {
      // console.log('addon: ', addon)
      if (addonSchemas === undefined || addonSchemas[addon.name] === undefined) {
        continue
      }
      const hydratedObject = searchTreeData[addon.name] || {}
      const keyResults = sh.forValue(hydratedObject, regexp)

      const filterKeys = generateResultsAndFilterIds(keyResults)
      setFilterKeys((prev) => {
        if (prev[addon.name] === undefined) {
          prev[addon.name] = []
        }
        return { ...prev, [addon.name]: [...prev[addon.name], ...filterKeys] }
      })
    }

    return []
  }

  return (
    <Toolbar>
      <SearchDropdown
        placeholder="Search and filter settings"
        suggestions={[]}
        suggestionsLimit={10}
        isLoading={false}
        hideSuggestions={true}
        onSubmit={() => {
          searchCallback(search, filterKeys)
        }}
        onClear={() => searchCallback()}
        onFocus={() => {}}
        onClose={() => {}}
        filter={(newSearch) => {
          setSearch(newSearch)
          return filter()
        }}
      />

      <Spacer />

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