// @ts-ignore
import sh from 'searchhash';

import SearchDropdown from '@components/SearchDropdown/SearchDropdown'
import { Button, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { useEffect, useState } from 'react';
import { $Any } from '@types';
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
  addonSchemas: $Any
  setShowHelp: (value: boolean) => void
  searchCallback: (searchText?: string, filterKeys?: string[]) => void
}

const SettingsListHeader = ({
  addonsData,
  addonSchemas,
  showHelp,
  setShowHelp,
  searchCallback,
}: Props) => {
  if (addonsData.length === 0) {
    return null
  }

  /*
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
    */

  const [search, setSearch] = useState<string>('')
  const [filterKeys, setFilterKeys] = useState<string[]>([])
  useEffect(() => {
    filter()
  }, [addonsData, addonSchemas])

  useEffect(() => {
  }, [filterKeys])

  const filter = () => {
    if (search === '') {
      setFilterKeys([])
      return []
    }

    const regexp = RegExp(search, 'i')

    let computedSuggestions = []
    setFilterKeys([])
    for (const addon of addonsData) {
      // console.log('addon: ', addon)
      if (addonSchemas === undefined || addonSchemas[addon.name] === undefined) {
        continue
      }
      const hydratedObject = attachLabels(addon.settings, addonSchemas[addon.name], addonSchemas[addon.name])
      const keyResults = sh.forValue(hydratedObject, regexp)

      const { suggestions: addonSuggestions, filterKeys } = generateResultsAndFilterIds(
        keyResults,
        hydratedObject,
        addon,
      )
      setFilterKeys((prev) => {
        return [...prev, ...filterKeys]
      })

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