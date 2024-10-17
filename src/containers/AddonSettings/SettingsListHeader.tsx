// @ts-ignore
import sh from 'searchhash';

import SearchDropdown, { Suggestion } from '@components/SearchDropdown/SearchDropdown'
import { Button, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { useState } from 'react';
import { $Any } from '@types';
import { useGetAddonSettingsSchemaQuery } from '@queries/addonSettings';
import { hydrate } from 'react-dom';

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
}

const SettingsListHeader = ({ showHelp, setShowHelp, addonsData, projectName }: Props) => {
  if (addonsData.length === 0) {
    return 'foo'
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

  console.log('schema: ', schema, schemaLoading, refetchSchema)



  console.log(addonsData)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])


  const generateSuggestion = ({
    addonName,
    path,
    id,
    value,
    isKey = false,
  }: {
    addonName: string
    path: string
    id: string
    value?: string
    isKey?: boolean
  }): Suggestion => {
    return {
      id: 'id: ' + id,
      icon: 'chevron_right',
      label: addonName + ': ' + path.split('/').join(' / ') + (value ? ` :: "${value}"` : ''),
      value: isKey ? '' : 'value: ' + value,
    }
  }

  const filter = (newSearch: string, suggestions: Suggestion[]) => {
    console.log('filtering...')
    console.log('data: ', addonsData)
    console.log(newSearch)
    console.log(suggestions)
    const regexp = RegExp(newSearch, 'i')
    console.log('regexp: ', regexp)
    let results: Suggestion[] = []
    for (const addon of addonsData) {
      console.log('addon: ', addon)
      const hydratedObject  = attachLabels(addon.settings, schema, schema)
      console.log('hydrated object: ', hydratedObject)
      const result = sh.forValue(hydratedObject, regexp)
      const result2 = sh.forValue(addon.settings, regexp)

      console.log('keys: ', result)
      console.log('values: ', result2)
      let i = 0
      result.forEach((keyRes: $Any) => {
        console.log(keyRes.value.__label__)
        results.push(generateSuggestion({
          addonName: addon.title,
          path: generatePath(hydratedObject, keyRes.path.substr(0, keyRes.path.length -10)), // /__label__ length
          id: addon.title + i++,
          value: keyRes.value.__label__,
          isKey: true
        }))
      })
      result2.forEach((keyRes: $Any) => {
        results.push(generateSuggestion({
          addonName: addon.title,
          path: keyRes.path,
          value: keyRes.value,
          id: addon.title + i++,
        }))
      })
    }

    console.log('results: ', results)
    return results
  }

  return (
    <Toolbar>
      <SearchDropdown
        placeholder="Search & filter settings"
        suggestions={suggestions}
        suggestionsLimit={10}
        isLoading={false}
        onSubmit={() => {}}
        onClear={() => {}}
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

  // console.log('settings: ', settings)
  // console.log('schema: ', relSchema)
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
const generatePath = (hydratedObject: $Any, path: $Any) => {
  console.log('path: ', path)
  let friendlyPath = []
  let relSchema = hydratedObject
  for (const key of path.split('/')) {
    friendlyPath.push(relSchema[key].__label__)
    relSchema = relSchema[key]
  }
    return friendlyPath.join('/')
}

export default SettingsListHeader