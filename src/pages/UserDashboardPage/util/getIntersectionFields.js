import { snakeCase } from 'lodash'

const intersectArrays = (arrays) => {
  const nameCounts = new Map()
  for (const arr of arrays) {
    for (const item of arr) {
      const name = item.name
      const count = nameCounts.get(name) || 0
      nameCounts.set(name, count + 1)
    }
  }
  const intersection = []
  for (const [name, count] of nameCounts) {
    if (count === arrays.length) {
      // find the first item with this name
      const item = arrays[0].find((item) => item.name === name)
      intersection.push({ ...item, id: snakeCase(name) })
    }
  }
  return intersection
}

export const getIntersectionFields = (projectInfo = {}, splitBy, projects = []) => {
  // first get all the fields
  const fields = Object.entries(projectInfo)
    .filter(([k]) => projects.includes(k))
    .map(([, project]) => project[splitBy])
  //   then merge them into one array
  const mergedFields = intersectArrays(fields)

  return mergedFields
}
