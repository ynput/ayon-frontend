// @ts-ignore
import sh from 'searchhash';

import SearchDropdown, { Suggestion } from '@components/SearchDropdown/SearchDropdown'
import { Button, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { useState } from 'react';
import { $Any } from '@types';
import { useGetAddonSettingsSchemaQuery } from '@queries/addonSettings';
import { generateResultsAndFilterIds } from './helpers';

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
  projectName: string
  setShowHelp: (value: boolean) => void
  searchCallback: (searchText?: string, filterKeys?: string[]) => void
}

const SettingsListHeader = ({ showHelp, setShowHelp, addonsData, projectName, searchCallback }: Props) => {
  if (addonsData.length === 0) {
    return null
  }


  const {
    data: schema,
    isLoading: schemaLoading,
    refetch: refetchSchema,
  } = useGetAddonSettingsSchemaQuery({
    addonName: addonsData[0].name,
    addonVersion: addonsData[0].version,
    variant: addonsData[0].variant,
    projectName,
  })

  // console.log('schema: ', schema, schemaLoading )


  const [search, setSearch] = useState<string>('')
  const [filterKeys, setFilterKeys] = useState<string[]>([])



  const filter = (newSearch: string) => {
    setSearch(newSearch)
    const regexp = RegExp(newSearch, 'i')
    let computedSuggestions = []
    for (const addon of addonsData) {
      // console.log('addon: ', addon)
      const hydratedObject  = attachLabels(addon.settings, schema, schema)
      console.log('hydrated object: ', hydratedObject)
      const keyResults = sh.forValue(hydratedObject, regexp)
      console.log('key results: ', keyResults)

      const {suggestions: addonSuggestions, filterKeys} = generateResultsAndFilterIds(keyResults, hydratedObject, addon)
      setFilterKeys(filterKeys)

      computedSuggestions = addonSuggestions

      // const result2 = sh.forValue(addon.settings, regexp)
      // result2.forEach((keyRes: $Any) => {
      //   results.push(generateSuggestion({
      //     addonName: addon.title,
      //     path: keyRes.path,
      //     value: keyRes.value,
      //     id: addon.title + i++,
      //   }))
      // })
    }

    return []
  }

  return (
    <Toolbar>
      <SearchDropdown
        placeholder="Search & filter settings"
        suggestions={[]}
        suggestionsLimit={10}
        isLoading={false}
        hideSuggestions={true}
        onSubmit={() => {
          searchCallback(search, filterKeys)
        }}
        onClear={() => {searchCallback()}}
        onFocus={() => {}}
        onClose={() => {}}
        filter={filter}
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


const attachLabels = (settings: $Any, relSchema: $Any, globalSchema: $Any): $Any => {
  const getDeepObject = (schema: $Any, pathList: string[]) => {
    let ref = schema
    for (const item of pathList) {
      ref = ref[item]
    }

    return ref
  }

  let hydratedObject: $Any = {}
  for (const key of Object.keys(settings)) {
    const schemaVal = relSchema.properties[key]
    if (Object.keys(schemaVal).includes('allOf')) {
      const refChain = schemaVal.allOf[0].$ref.slice(2).split('/')
      const deepSchema = getDeepObject(globalSchema, refChain)
      // console.log('refchain: ', refChain)
      hydratedObject[key] = {
        ...attachLabels(settings[key], deepSchema, globalSchema),
        __label__: relSchema.properties[key].title,
      }
    }
  }
  // console.log('hydrated object: ', hydratedObject)

  return hydratedObject
}

export default SettingsListHeader