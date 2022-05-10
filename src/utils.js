import axios from 'axios'


const arrayEquals = (a, b) => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  )
}


const sortByKey = (array, key) => {
  /* sort an array of objects by a given key */
  return array.sort(function (a, b) {
    var x = a[key]
    var y = b[key]
    return x < y ? -1 : x > y ? 1 : 0
  })
}


const isGroupable = (data, key, value) => {
  // Returns true if the key with the given value is 
  // presented multiple times in the array
  // and therefore can be grouped.
  let count = 0
  for (const item of data) {
    if (item[key] === value){
      count++
      if (count > 1)
        return true
    }
  }
  return false
}


const groupResult = (data, groupBy, key="id") => {
  // Transform a list of records to a TreeTable-compatible structure
  // with grouped records.
  let result = []
  let existingGroups = []
  for (const item of data) {
    // Unique items. Just add to root
    if (!isGroupable(data, groupBy, item[groupBy])) {
      result.push({ key: item[key], data: item })
    } 

    // Item of an existing group
    else if (existingGroups.includes(item[groupBy])) {
      for (const group of result) {
        if (group.data[groupBy] === item[groupBy]) {
          group.children.push({
            key: item[key],
            data: item
          })
          break
        }
      }
    } 

    // New group
    else {
      existingGroups.push(item[groupBy])
      result.push({
        key: `group-${item[groupBy]}`,
        data: {
          [groupBy]: item[groupBy]
        },
        children: [{
          key: item[key],
          data: item
        }]
      })
    }
  }
  return result
}

const loadAnatomyPresets = async () => {
  const defaultPreset = { name: '_', title: '<default (built-in)>' }
  let response
  try {
    response = await axios.get('/api/anatomy/presets')
  } catch (error) {
    return []
  }
  let primaryPreset = defaultPreset
  let presets = []
  for (const preset of response.data.presets) {
    if (preset.primary)
      primaryPreset = { name: preset.name, title: `<default (${preset.name})>` }
    presets.push({
      name: preset.name,
      title: preset.name,
      version: preset.version,
      primary: preset.primary ? 'PRIMARY' : '',
    })
  }
  return [primaryPreset, ...presets]
}

export { arrayEquals, loadAnatomyPresets, groupResult, sortByKey }
