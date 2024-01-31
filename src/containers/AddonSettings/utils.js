import { isEqual } from 'lodash'

const getValueByPath = (obj, path) => {
  // path is an array of keys
  // e.g. ['a', 'b', 'c'] => obj.a.b.c
  // if any key is not found, return undefined

  if (path?.length === 0) return obj
  let value = obj
  for (const key of path) {
    if (value === undefined) return undefined
    value = value[key]
  }
  return value
}

const setValueByPath = (obj, path, value) => {
  const result = { ...obj }
  if (path?.length === 0) return value
  let target = result
  for (const key of path.slice(0, -1)) {
    if (target[key] === undefined) target[key] = {}
    target = target[key]
  }
  target[path[path.length - 1]] = value
  return result
}

const sameKeysStructure = (obj1, obj2) => {
  for (const type of ['string', 'number', 'boolean', 'undefined', 'null']) {
    if (typeof obj1 === type && typeof obj2 === type) {
      return true
    }
  }

  // just assume someone won't paste invalid array items here
  if (Array.isArray(obj1) && Array.isArray(obj2)) return true

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
  // console.log('obj1', obj1)
  // console.log('obj2', obj2)
  const obj1Keys = Object.keys(obj1 || {})
  //const obj2Keys = Object.keys(obj2 || {})

  // this is a bit too strict. schemas may change slightly, but still be compatible
  // if (obj1Keys.length !== obj2Keys.length) {
  //   console.warn('Len cond failed on ', obj1Keys, obj2Keys)
  //   return false
  // }

  for (const key of obj1Keys) {
    // Let's allow this and see what happens
    // if (!obj2Keys.includes(key)) return false

    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      // just assume someone won't paste invalid array items here
      if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) continue

      if (!sameKeysStructure(obj1[key], obj2[key])) {
        console.warn('Struct cond failed on ', obj1[key], obj2[key])
        return false
      }
    }
  }
  return true
}

const compareObjects = (obj1, obj2, path = []) => {
  // Compare two objects and return a list of 'paths' where the objects differ
  const changedPaths = []
  for (const key in obj1) {
    const newPath = [...path, key]

    if (!(key in obj2)) {
      changedPaths.push(newPath)
      continue
    }

    const value1 = obj1[key]
    const value2 = obj2[key]

    if (typeof value1 === 'object' && typeof value2 === 'object') {
      if (Array.isArray(value1) && Array.isArray(value2)) {
        if (!isEqual(value1, value2)) {
          changedPaths.push(newPath)
        }
      } else {
        const nestedPaths = compareObjects(value1, value2, newPath)
        changedPaths.push(...nestedPaths)
      }
    } else if (value1 !== value2) {
      changedPaths.push(newPath)
    }
  }
  for (const key in obj2) {
    const newPath = [...path, key]
    if (!(key in obj1)) {
      changedPaths.push(newPath)
    }
  }
  return changedPaths
}

export { getValueByPath, setValueByPath, sameKeysStructure, compareObjects }
