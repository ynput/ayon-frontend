const SIMPLE_TYPES = ['string', 'number', 'boolean']

const isSimple = (obj) => SIMPLE_TYPES.includes(typeof obj)
const isList = (obj) => Array.isArray(obj)
const isDict = (obj) => typeof obj === 'object' && !isList(obj)

const isListOfSimple = (arr) => {
  if (!isList(arr)) return false
  for (const item of arr) {
    if (!isSimple(item)) return false
  }
  return true
}

const isListOfNamedDicts = (arr) => {
  if (!isList(arr)) return false
  const names = []
  for (const item of arr) {
    if (!isDict(item)) return false
    if (!('name' in item)) return false
    names.push(item.name)
  }
  if (!names.length) return false
  return names
}

const isListOfWhat = (arr) => {
  // return a type if all items in array are that type, otherwise return false
  let type = null
  for (const item of arr) {
    if (type === null) {
      type = typeof item
    } else if (typeof item !== type) {
      return false
    }
  }
  return type
}

const isCompatibleStructure = (obj1, obj2) => {
  const warnings = []

  for (const type of SIMPLE_TYPES) {
    if (typeof obj1 === type && typeof obj2 === type) {
      return []
    }
  }

  if (isList(obj1) && isList(obj2)) {
    if (!obj1.length || !obj2.length) {
      // one of the lists is empty
      // this is allowed, but we don't know what type the list is
      // so we need to warn
      warnings.push('One of the lists is empty')
    } else {
      const firstType = isListOfWhat(obj1)
      const secondType = isListOfWhat(obj2)
      if (firstType === false || secondType === false) {
        // lists don't have uniform types. e.g. [1, 'a', 3]
        // this is not allowed
        return false
      }
      if (firstType === secondType) {
        // both arrays are of the same type
        if (SIMPLE_TYPES.includes(firstType)) return []

        const res = isCompatibleStructure(obj1[0], obj2[0])
        if (res === false) return false
        warnings.push(...res)
      } // lists have same types
    }
  } // both objects are lists
  else if (isDict(obj1) && isDict(obj2)) {
    // dicts don't necessarily have the same keys
    // but if they do, they must have the same structure

    const obj1Keys = Object.keys(obj1)
    const obj2Keys = Object.keys(obj2)

    if (obj1Keys.length !== obj2Keys.length) {
      warnings.push('Objects have different number of keys')
    }

    for (const key of obj1Keys) {
      if (!obj2Keys.includes(key)) {
        warnings.push(`Object 2 is missing key ${key}`)
        continue
      }

      const res = isCompatibleStructure(obj1[key], obj2[key])
      if (res === false) return false
      warnings.push(...res)
    }
  } // both objects are dicts
  else {
    // objects are not of the same type
    if (!obj1 || !obj2) warnings.push('One of the objects is empty')
    else return false
  }

  return warnings
}

export { isSimple, isList, isDict, isListOfSimple, isListOfNamedDicts, isCompatibleStructure }
