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
  console.log('path: ', path)
  return {
    id: 'id: ' + id,
    icon: 'chevron_right',
    label: addonName + ': ' + path.split('/').join(' / ') + (value ? ` :: "${value}"` : ''),
    value: isKey ? '' : 'value: ' + value,
  }
}

const generateFilterKey = (path: string) => {
  console.log('generating filter key...')
  console.log('path: ', path)

  return ['root', ...path.split('/')].join('_')
}

const generateResultsAndFilterIds = (keyResults: $Any, hydratedObject: $Any, addon: $Any) => {
  let i = 0
  let suggestions: $Any = []
  let filterKeys: string[]  = []
  keyResults.forEach((keyRes: $Any) => {
    console.log('keyRes: ', keyRes)
    suggestions.push(
      generateSuggestion({
        addonName: addon.title,
        path: generatePath(hydratedObject, keyRes.path.substr(0, keyRes.path.length - 10)), // /__label__ length
        id: addon.title + i++,
        value: keyRes.value.__label__,
        isKey: true,
      }),
    )
    filterKeys.push(generateFilterKey(keyRes.path.substr(0, keyRes.path.length - 10)))
  })
  return { suggestions, filterKeys }
}

export { generateResultsAndFilterIds }
