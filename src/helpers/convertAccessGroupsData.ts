// takes access groups string JSON and converts it to an array of objects

export type AccessGroups = {
  [key: string]: string[]
}

const convertAccessGroupsData = (json: string): AccessGroups => {
  try {
    const data: AccessGroups = JSON.parse(json)
    return data
  } catch (error) {
    return {}
  }
}

export default convertAccessGroupsData
