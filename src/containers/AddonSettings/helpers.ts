import { Suggestion } from "@components/SearchDropdown/SearchDropdown"
import { $Any } from "@types"

const generatePath = (hydratedObject: $Any, path: $Any) => {
  // console.log('path: ', path)
  let friendlyPath = []
  let relSchema = hydratedObject
  for (const key of path.split('/')) {
    friendlyPath.push(relSchema[key].__label__)
    relSchema = relSchema[key]
  }
  return friendlyPath.join('/')
}

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
  // console.log('path: ', path)
  return {
    id: 'id: ' + id,
    icon: 'chevron_right',
    label: addonName + ': ' + path.split('/').join(' / ') + (value ? ` :: "${value}"` : ''),
    value: isKey ? '' : 'value: ' + value,
  }
}

const generateFilterKey = (path: string) => {
  return ['root', ...path.split('/')].join('_')
}

const generateResultsAndFilterIds = (keyResults: $Any) => {
  let filterKeys: string[] = []
  keyResults.forEach((keyRes: $Any) => {
    filterKeys.push(generateFilterKey(keyRes.path.substr(0, keyRes.path.length - 10)))
  })

  return filterKeys
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
      hydratedObject[key] = {
        ...attachLabels(settings[key], deepSchema, globalSchema),
        __label__: relSchema.properties[key].title,
      }
    }
    if (['array', 'boolean', 'string'].includes(schemaVal.type)) {
      hydratedObject[key] = {
        __label__: relSchema.properties[key].title,
      }
      if (schemaVal.type === 'string') {
        hydratedObject[key].__value__ = settings[key]
      }
      if (schemaVal.description !== undefined) {
        //__descr__ matches __label__ str length - keep an eye on it, it's used in other places!
        hydratedObject[key].__descr__ = schemaVal.description
      }
    }
  }

  return hydratedObject
}

export { generateResultsAndFilterIds, attachLabels }
