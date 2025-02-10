
const listsIntersect = (listA: string[], listB: string[]) => {
  if (listA === undefined) {
    return false
  }
  for (const value of listB) {
    if (listA.includes(value)) {
      return true
    }
  }
  return false
}

const scalarIntersects = (value: string, listB: string[]) => {
  if (listB.includes(value)) {
    return true
  }
  return false
}

export { listsIntersect, scalarIntersects }