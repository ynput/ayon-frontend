import { $Any } from "@types"

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
    if (schemaVal === undefined) {
      continue
    }
    if (Object.keys(schemaVal).includes('allOf')) {
      const refChain = schemaVal.allOf[0].$ref.slice(2).split('/')
      const deepSchema = getDeepObject(globalSchema, refChain)
      hydratedObject[key] = {
        ...attachLabels(settings[key], deepSchema, globalSchema),
        __label__: relSchema.properties[key].title,
      }
    }
    if (['array', 'boolean', 'string', 'integer', 'number'].includes(schemaVal.type)) {
      hydratedObject[key] = {
        __label__: relSchema.properties[key].title,
      }

      if (schemaVal.type === 'array') {
        if (Object.keys(schemaVal).includes('items') && schemaVal.items.type !== undefined) {
          for (const idx in settings[key]) {
            hydratedObject[key][idx] = {}
            hydratedObject[key][idx][settings[key][idx]] = {
              __label__: settings[key][idx],
            }
          }
        }
        if (Object.keys(schemaVal).includes('items') && schemaVal.items.$ref !== undefined) {
          const refChain = schemaVal.items.$ref.slice(2).split('/')
          const deepSchema = getDeepObject(globalSchema, refChain)
          for (const idx in settings[key]) {
            hydratedObject[key][idx] = {
              ...attachLabels(settings[key][idx], deepSchema, globalSchema),
            }
          }
        }
      }

      if (['string', 'integer', 'number'].includes(schemaVal.type)) {
        hydratedObject[key].__value__ = settings[key].toString()
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
